# Prótesis total de rodilla — script para Autodesk Fusion

Modelo conceptual paramétrico de una prótesis total de rodilla (tipo CR, conserva el ligamento cruzado posterior).

## Piezas
| Pieza | Material sugerido | Medidas (talla 1.0) |
|---|---|---|
| Componente femoral | Cromo-cobalto | 70 mm ML × ~69 mm AP, 10 mm distal, 5 cortes óseos, escotadura de 18 mm, 2 tetones Ø7×12 mm |
| Inserto | Polietileno UHMW | 10 mm de espesor, superficies articulares conformes al fémur (3 mm de profundidad) |
| Bandeja tibial | Titanio Ti-6Al-4V | 72 × 48 mm, 4 mm de espesor, vástago Ø14×40 mm, quilla 3×40×25 mm |

## Cómo usarlo
1. En Fusion: **Utilidades → Complementos → Scripts y complementos** (Shift+S).
2. Pulsa **+** → *Script desde mi equipo* y elige la carpeta `ProtesisRodilla`.
3. Ejecuta. Se crea un documento nuevo con las tres piezas montadas.
4. Para cambiar la talla, edita `TALLA` al principio del `.py` (0.9 pequeña, 1.1 grande).
5. Para imprimir un modelo: clic derecho sobre cada cuerpo → **Guardar como malla (STL/3MF)**.

> ⚠️ Modelo con fines educativos y de diseño. No sirve para uso clínico ni para fabricar implantes reales: eso requiere datos anatómicos del paciente, análisis por elementos finitos, validación y certificación regulatoria.
