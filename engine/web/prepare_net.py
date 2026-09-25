"""Rewrite an exported network so ONNX Runtime Web's WebGPU backend can keep it on the GPU.

WebGPU has no kernels for And or shape arithmetic, so those nodes fall back to the CPU. Comparisons are cast to
numbers right away and And becomes Mul, the policy reshape gets a constant shape, and the unused opponent-policy head
is dropped. Outputs are unchanged.

    python engine/web/prepare_net.py IN.onnx OUT.onnx
"""
import sys

import numpy as np
import onnx
from onnx import helper, numpy_helper, utils

CROP_CELLS = 25 * 25  # engine/src/planes.hpp kCrop squared


def rewrite(model: onnx.ModelProto) -> onnx.ModelProto:
    graph = model.graph
    nodes = list(graph.node)
    producer = {out: n for n in nodes for out in n.output}
    consumers: dict[str, list[onnx.NodeProto]] = {}
    for n in nodes:
        for i in n.input:
            consumers.setdefault(i, []).append(n)

    # The number type the booleans end up as (float32, or float16 in a half-precision export).
    casts = [n for n in nodes if n.op_type == "Cast" and producer.get(n.input[0]) is not None
             and producer[n.input[0]].op_type in ("Greater", "Less", "And")]
    targets = {helper.get_attribute_value(next(a for a in n.attribute if a.name == "to")) for n in casts}
    assert len(targets) == 1, targets
    to = targets.pop()

    out_nodes: list[onnx.NodeProto] = []
    for n in nodes:
        if n.op_type in ("Greater", "Less"):
            for c in consumers.get(n.output[0], []):
                assert c.op_type in ("And", "Cast"), c.op_type
            boolean = n.output[0] + "_bool"
            out_nodes.append(helper.make_node(n.op_type, list(n.input), [boolean], name=n.name))
            out_nodes.append(helper.make_node("Cast", [boolean], [n.output[0]], name=n.name + "_num", to=to))
        elif n.op_type == "And":
            for c in consumers.get(n.output[0], []):
                assert c.op_type in ("And", "Cast"), c.op_type
            out_nodes.append(helper.make_node("Mul", list(n.input), list(n.output), name=n.name))
        elif n in casts:
            out_nodes.append(helper.make_node("Identity", list(n.input), list(n.output), name=n.name))
        elif n.op_type == "Reshape" and producer.get(n.input[1]) is not None and producer[n.input[1]].op_type == "Concat":
            # Reshape(conv, Concat(Shape(conv)[:2], [-1])) -> Reshape(conv, [-1, heads, cells]): the policy maps.
            conv = producer[n.input[0]]
            assert conv.op_type == "Conv", conv.op_type
            heads = next(t for t in graph.initializer if t.name == conv.input[1]).dims[0]
            tail_values = np.array([heads, CROP_CELLS])
            shape_name = n.name + "_static_shape"
            graph.initializer.append(numpy_helper.from_array(
                np.concatenate([[-1], tail_values.reshape(-1)]).astype(np.int64), shape_name))
            out_nodes.append(helper.make_node("Reshape", [n.input[0], shape_name], list(n.output), name=n.name))
        else:
            out_nodes.append(n)

    del graph.node[:]
    graph.node.extend(out_nodes)
    kept = [o.name for o in graph.output if o.name != "opponent"]
    pruned = utils.Extractor(model).extract_model([i.name for i in graph.input], kept)
    onnx.checker.check_model(pruned)
    pruned.producer_name = "Six by CixMango"
    del pruned.metadata_props[:]
    for key, value in (("copyright", "Copyright (c) 2026 CixMango. All rights reserved."),
                       ("license", "Proprietary. Only for playing Six on https://playsix.cixmango.workers.dev. No copying, "
                                   "redistribution, reverse-engineering, fine-tuning or reuse elsewhere without written "
                                   "permission from CixMango (Discord: cix).")):
        pruned.metadata_props.add(key=key, value=value)
    return pruned


def main() -> int:
    src, dst = sys.argv[1], sys.argv[2]
    model = rewrite(onnx.load(src))
    onnx.save(model, dst)
    ops = sorted({n.op_type for n in model.graph.node})
    print(f"wrote {dst}: {len(model.graph.node)} nodes, ops {', '.join(ops)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
