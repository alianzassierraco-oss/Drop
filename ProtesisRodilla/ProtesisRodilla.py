# Protesis total de rodilla (modelo conceptual) para Autodesk Fusion.
# Genera: componente femoral, bandeja tibial con vastago y quilla, e inserto
# de polietileno cuya superficie articular se ajusta al componente femoral.
# Uso: Utilidades > Scripts y complementos > "+" > seleccionar esta carpeta > Ejecutar.
# AVISO: modelo educativo/de diseno. No apto para uso clinico ni fabricacion de implantes.

import adsk.core, adsk.fusion, traceback

# Factor de talla: 1.0 = talla media (~70 mm ancho femoral). Ej.: 0.9 pequena, 1.1 grande.
TALLA = 1.0


def mm(v):
    # La API de Fusion trabaja internamente en centimetros.
    return v * TALLA / 10.0


def P(x, y, z=0.0):
    return adsk.core.Point3D.create(mm(x), mm(y), mm(z))


def val(v):
    return adsk.core.ValueInput.createByReal(mm(v))


def extrude_sym(comp, profile, total, op, bodies=None):
    ext = comp.features.extrudeFeatures
    inp = ext.createInput(profile, op)
    inp.setSymmetricExtent(val(total), True)
    if bodies is not None:
        inp.participantBodies = bodies
    return ext.add(inp)


def move_y(comp, body, dy):
    if abs(dy) < 1e-9:
        return
    col = adsk.core.ObjectCollection.create()
    col.add(body)
    m = adsk.core.Matrix3D.create()
    m.translation = adsk.core.Vector3D.create(0, dy, 0)
    moves = comp.features.moveFeatures
    try:
        mi = moves.createInput2(col)
        mi.defineAsFreeMove(m)
    except AttributeError:
        mi = moves.createInput(col, m)
    moves.add(mi)


def place_min_y(comp, body, y):
    move_y(comp, body, mm(y) - body.boundingBox.minPoint.y)


def place_max_y(comp, body, y):
    move_y(comp, body, mm(y) - body.boundingBox.maxPoint.y)


def combine(comp, target, tool, op, keep_tool=False):
    tools = adsk.core.ObjectCollection.create()
    tools.add(tool)
    ci = comp.features.combineFeatures.createInput(target, tools)
    ci.operation = op
    ci.isKeepToolBodies = keep_tool
    return comp.features.combineFeatures.add(ci)


def transverse_spline(sketch, pts_xz):
    # Puntos (x = antero-posterior, z = medio-lateral) en el plano transversal.
    col = adsk.core.ObjectCollection.create()
    for x, z in pts_xz:
        col.add(sketch.modelToSketchSpace(P(x, 0, z)))
    spline = sketch.sketchCurves.sketchFittedSplines.add(col)
    spline.isClosed = True
    return spline


# Contorno de la meseta tibial con escotadura posterior (para el LCP).
CONTORNO_TIBIAL = [
    (22, 0), (20, 25), (10, 36), (-10, 35), (-22, 26), (-24, 14), (-18, 6),
    (-18, -6), (-24, -14), (-22, -26), (-10, -35), (10, -36), (20, -25),
]


def crear_femoral(comp):
    sk = comp.sketches.add(comp.xYConstructionPlane)
    sk.name = 'Perfil sagital femoral'
    lines = sk.sketchCurves.sketchLines

    # Superficie articular externa (x+ = anterior, y+ = proximal).
    ext = adsk.core.ObjectCollection.create()
    for x, y in [(34, 40), (35, 20), (30, 2), (18, -8), (0, -10),
                 (-18, -8), (-30, 2), (-33, 15), (-32, 30)]:
        ext.add(P(x, y))
    spl = sk.sketchCurves.sketchFittedSplines.add(ext)

    # Cortes oseos internos: anterior, chaflan anterior, distal, chaflan posterior, posterior.
    interno = [(-24, 30), (-24, 10), (-14, 0), (14, 0), (28, 12), (28, 40)]
    prev = lines.addByTwoPoints(spl.endSketchPoint, P(*interno[0])).endSketchPoint
    for pt in interno[1:]:
        prev = lines.addByTwoPoints(prev, P(*pt)).endSketchPoint
    lines.addByTwoPoints(prev, spl.startSketchPoint)

    femur = extrude_sym(comp, sk.profiles.item(0), 70,
                        adsk.fusion.FeatureOperations.NewBodyFeatureOperation).bodies.item(0)
    femur.name = 'Componente femoral'

    # Escotadura intercondilea (abierta hacia posterior/distal).
    skn = comp.sketches.add(comp.xYConstructionPlane)
    skn.name = 'Escotadura intercondilea'
    skn.sketchCurves.sketchLines.addTwoPointRectangle(P(-40, -15), P(8, 45))
    cuerpos = [femur]
    extrude_sym(comp, skn.profiles.item(0), 18,
                adsk.fusion.FeatureOperations.CutFeatureOperation, cuerpos)

    # Dos tetones de fijacion sobre el corte distal (y = 0 a 12 mm).
    for z in (-18, 18):
        skp = comp.sketches.add(comp.xZConstructionPlane)
        skp.name = 'Teton %+d' % z
        skp.sketchCurves.sketchCircles.addByCenterRadius(
            skp.modelToSketchSpace(P(2, 0, z)), mm(3.5))
        peg = extrude_sym(comp, skp.profiles.item(0), 12,
                          adsk.fusion.FeatureOperations.NewBodyFeatureOperation).bodies.item(0)
        place_min_y(comp, peg, -0.5)
        combine(comp, femur, peg, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    return femur


def crear_tibial(comp):
    new = adsk.fusion.FeatureOperations.NewBodyFeatureOperation
    join = adsk.fusion.FeatureOperations.JoinFeatureOperation

    # Bandeja (4 mm) entre y = -21 y -17.
    sk = comp.sketches.add(comp.xZConstructionPlane)
    sk.name = 'Contorno bandeja tibial'
    transverse_spline(sk, CONTORNO_TIBIAL)
    tray = extrude_sym(comp, sk.profiles.item(0), 4, new).bodies.item(0)
    tray.name = 'Bandeja tibial'
    place_min_y(comp, tray, -21)

    # Vastago central (diametro 14 mm, 40 mm de largo).
    sks = comp.sketches.add(comp.xZConstructionPlane)
    sks.name = 'Vastago'
    sks.sketchCurves.sketchCircles.addByCenterRadius(sks.modelToSketchSpace(P(0, 0, 0)), mm(7))
    stem = extrude_sym(comp, sks.profiles.item(0), 40, new).bodies.item(0)
    place_max_y(comp, stem, -20.5)
    combine(comp, tray, stem, join)

    # Quilla antirrotacional (3 x 40 mm, 25 mm de alto).
    skk = comp.sketches.add(comp.xZConstructionPlane)
    skk.name = 'Quilla'
    skk.sketchCurves.sketchLines.addTwoPointRectangle(
        skk.modelToSketchSpace(P(-1.5, 0, -20)), skk.modelToSketchSpace(P(1.5, 0, 20)))
    keel = extrude_sym(comp, skk.profiles.item(0), 25, new).bodies.item(0)
    place_max_y(comp, keel, -20.5)
    combine(comp, tray, keel, join)
    return tray


def crear_inserto(comp, femur):
    sk = comp.sketches.add(comp.xZConstructionPlane)
    sk.name = 'Contorno inserto'
    transverse_spline(sk, CONTORNO_TIBIAL)
    ins = extrude_sym(comp, sk.profiles.item(0), 10,
                      adsk.fusion.FeatureOperations.NewBodyFeatureOperation).bodies.item(0)
    ins.name = 'Inserto polietileno'
    place_min_y(comp, ins, -17)  # de y = -17 a -7
    # Superficies articulares conformes: se restan los condilos femorales (3 mm de cazoleta).
    combine(comp, ins, femur, adsk.fusion.FeatureOperations.CutFeatureOperation, keep_tool=True)
    return ins


def asignar_material(app, body, nombres):
    for lib_name in ('Fusion Material Library', 'Fusion 360 Material Library'):
        lib = app.materialLibraries.itemByName(lib_name)
        if not lib:
            continue
        for n in nombres:
            mat = lib.materials.itemByName(n)
            if mat:
                body.material = mat
                return


def run(context):
    app = adsk.core.Application.get()
    ui = app.userInterface
    try:
        doc = app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
        doc.name = 'Protesis total de rodilla'
        design = adsk.fusion.Design.cast(app.activeProduct)
        design.designType = adsk.fusion.DesignTypes.ParametricDesignType
        comp = design.rootComponent

        femur = crear_femoral(comp)
        tray = crear_tibial(comp)
        ins = crear_inserto(comp, femur)

        for b, mats in ((femur, ['Cobalt Chrome', 'Steel, Stainless 316L', 'Steel, Stainless']),
                        (tray, ['Titanium 6Al-4V', 'Titanium', 'Titanium Alloy']),
                        (ins, ['Polyethylene, UHMW', 'Polyethylene', 'Plastic'])):
            try:
                asignar_material(app, b, mats)
            except Exception:
                pass

        app.activeViewport.fit()
        ui.messageBox('Protesis de rodilla generada:\n- Componente femoral\n- Bandeja tibial con vastago y quilla\n'
                      '- Inserto de polietileno\n\nModelo conceptual, no apto para uso clinico.')
    except Exception:
        ui.messageBox('Error:\n{}'.format(traceback.format_exc()))
