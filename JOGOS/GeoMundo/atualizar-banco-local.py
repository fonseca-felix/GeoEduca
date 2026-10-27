from pathlib import Path
import json
root = Path(__file__).resolve().parent
bundle = {"questions": json.loads((root / "data/questions.json").read_text(encoding="utf-8")), "countries": json.loads((root / "data/countries.json").read_text(encoding="utf-8"))}
(root / "data/local-data.js").write_text("// Local-file fallback generated from the JSON source.\nwindow.GEO_MUNDO_LOCAL = " + json.dumps(bundle, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print("Banco local atualizado.")
