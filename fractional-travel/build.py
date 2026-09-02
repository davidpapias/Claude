#!/usr/bin/env python3
"""
Genera el sitio de La Fracción Nayarit.

Un solo origen produce dos salidas:
  * las páginas estáticas del hub (index.html, residencias.html, …),
    que comparten assets/styles.css y assets/site.js;
  * dist/preview.html, un archivo único con todas las páginas como
    rutas de hash, para previsualizar el hub completo sin servidor.

    python3 build.py
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- utilidades

def holder(ratio, what, spec="", extra=""):
    """Marco de foto: dice qué imagen va ahí y con qué proporción."""
    cls = " ".join(x for x in ["holder", ratio, extra] if x)
    s = '<span class="spec">%s</span>' % spec if spec else ""
    return ('<div class="%s"><span class="mark"></span>'
            '<span class="what">%s</span>%s</div>' % (cls, what, s))


def avail(sold, total=8):
    """Barra de fracciones vendidas / disponibles."""
    cells = "".join('<i class="%s"></i>' % ("sold" if i < sold else "open")
                    for i in range(total))
    return ('<div class="avail">%s</div>'
            '<p class="availkey"><span>%d de %d colocadas</span>'
            '<span>%d disponibles</span></p>' % (cells, sold, total, total - sold))


# ---------------------------------------------------------------- residencias
# Datos sin cambios: sólo se añadieron marcos de foto para mostrarlas.
RESIDENCIAS = [
    dict(slug="residencia-marea", body="La planta baja se abre por completo a la terraza, de modo que la sala, el comedor y la alberca funcionan como una sola pieza cuando el clima acompaña, que en esta costa son diez meses al año. La recámara principal ocupa el frente del segundo nivel, con acceso directo a la playa por una servidumbre privada. La marina queda a cuatro minutos caminando, lo que explica buena parte de su tarifa de renta.", name="Residencia Marea",
         loc="Nuevo Vallarta &middot; frente de playa", sold=5,
         m2="240 m&sup2;", rec="3 recámaras", ban="3.5 baños",
         value=1120000, frac=140000, opex=9800, rate=780,
         specs=["Alberca privada", "Marina a 400 m", "Terraza de 60 m&sup2;",
                "Cocina de autor", "Dos cajones de estacionamiento", "Entrega inmediata"],
         pitch=("Frente de playa directo, sin calle de por medio, en el corredor de "
                "Nuevo Vallarta. Es la residencia con mayor tarifa de renta de las tres "
                "y la que más rápido cerró sus primeras fracciones."),
         shots=[("r32", "Fachada desde la playa", "3:2 &middot; 2400×1600"),
                ("r11", "Alberca al atardecer", "1:1 &middot; 1600×1600"),
                ("r11", "Sala y terraza", "1:1 &middot; 1600×1600"),
                ("r11", "Recámara principal", "1:1 &middot; 1600×1600"),
                ("r11", "Cocina", "1:1 &middot; 1600×1600")]),
    dict(slug="residencia-sayulita-alta", body="Está construida en tres plataformas escalonadas sobre la ladera, así que cada nivel tiene su propia terraza y ninguna recámara comparte vista con otra. El estudio independiente en la plataforma baja tiene entrada aparte: sirve para huéspedes que llegan sin avisar o para rentarse por separado en temporada alta. Los paneles solares cubren cerca de la mitad del consumo anual.", name="Villa Sayulita Alta",
         loc="Sayulita &middot; colina con vista", sold=3,
         m2="185 m&sup2;", rec="3 recámaras", ban="3 baños",
         value=960000, frac=120000, opex=8400, rate=640,
         specs=["Terraza panorámica", "Pueblo a pie", "Alberca de borde infinito",
                "Estudio independiente", "Paneles solares", "Entrega inmediata"],
         pitch=("A ocho minutos a pie del pueblo y lo bastante arriba para que el ruido "
                "no llegue. La ocupación de Sayulita es la más pareja del año de las tres "
                "plazas: temporada alta larga y muy poca temporada muerta."),
         shots=[("r32", "Vista desde la terraza", "3:2 &middot; 2400×1600"),
                ("r11", "Alberca de borde infinito", "1:1 &middot; 1600×1600"),
                ("r11", "Comedor exterior", "1:1 &middot; 1600×1600"),
                ("r11", "Recámara con vista", "1:1 &middot; 1600×1600"),
                ("r11", "Camino al pueblo", "1:1 &middot; 1600×1600")]),
    dict(slug="residencia-nayar", body="Ocupa los dos últimos niveles del edificio con elevador privado que desemboca dentro del departamento. La sala es de doble altura y da al poniente, así que la puesta de sol sobre la bahía se ve desde el sofá y desde el jacuzzi del roof. Al estar en preventa, todavía admite cambios en acabados y en la distribución de las dos recámaras secundarias.", name="Penthouse Nayar",
         loc="Bucerías &middot; penthouse", sold=6,
         m2="310 m&sup2;", rec="4 recámaras", ban="4.5 baños",
         value=1760000, frac=220000, opex=15400, rate=1150,
         specs=["Roof privado", "Doble vista a la bahía", "Jacuzzi exterior",
                "Elevador privado", "Bodega y cuarto de servicio", "Preventa · entrega 2027"],
         pitch=("El ticket más alto y la única en preventa. Ocupa los dos últimos niveles "
                "con vista franca a la Bahía de Banderas por el sur y a la sierra por el "
                "oriente. Admite pago diferido a 24 meses con 40% de enganche."),
         shots=[("r32", "Roof privado al anochecer", "3:2 &middot; 2400×1600"),
                ("r11", "Doble altura de la sala", "1:1 &middot; 1600×1600"),
                ("r11", "Jacuzzi con vista", "1:1 &middot; 1600×1600"),
                ("r11", "Recámara principal", "1:1 &middot; 1600×1600"),
                ("r11", "Vista a la bahía", "1:1 &middot; 1600×1600")]),
]
RES_BY_SLUG = {r["slug"]: r for r in RESIDENCIAS}

# ---------------------------------------------------------------- navegación
NAV = [("residencias", "Residencias"), ("modelo", "El modelo"),
       ("inversion", "Inversión"), ("legal", "Estructura legal"),
       ("copropietarios", "Copropietarios")]

FOOTNAV = [
    ("Residencias", [("residencias", "Todas las residencias")] +
                    [(r["slug"], r["name"]) for r in RESIDENCIAS]),
    ("El modelo", [("modelo", "Cómo funciona"), ("inversion", "Los números"),
                   ("legal", "Estructura legal"), ("preguntas", "Preguntas frecuentes")]),
    ("La operación", [("nosotros", "Quiénes somos"), ("copropietarios", "Copropietarios"),
                      ("diario", "Diario"), ("agendar", "Agendar una llamada")]),
    ("Legal", [("avisos", "Aviso legal y privacidad")]),
]


# ---------------------------------------------------------------- plantilla

HEAD = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} &middot; La Fracción Nayarit</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{root}assets/styles.css">
</head>
<body>
"""

TAIL = """<script src="{root}assets/site.js"></script>
</body>
</html>
"""


def link(slug, single):
    """URL de una página: hash en el previsualizador, archivo en el sitio."""
    if single:
        return "#/" + slug
    return "index.html" if slug == "inicio" else slug + ".html"


def topbar(current, single):
    nav = "".join(
        '<a href="%s"%s%s>%s</a>' % (link(s, single),
                                     ' data-nav' if single else '',
                                     ' aria-current="page"' if s == current else '', t)
        for s, t in NAV)
    drawer = "".join(
        '<a href="%s"%s%s>%s</a>' % (link(s, single),
                                     ' data-nav' if single else '',
                                     ' aria-current="page"' if s == current else '', t)
        for s, t in NAV + [("nosotros", "Nosotros"), ("diario", "Diario"),
                           ("preguntas", "Preguntas")])
    return """<div class="topbar">
  <div class="wrap topbar-in">
    <a class="brand" href="{home}"><b>La Fracción</b><span>Nayarit</span></a>
    <nav class="navlinks">{nav}</nav>
    <a class="btn btn-sm" href="{book}">Agendar llamada <span class="arw">&rarr;</span></a>
    <button class="navtoggle" type="button" aria-expanded="false">Menú</button>
  </div>
  <div class="navdrawer">{drawer}<a class="btn" href="{book}">Agendar llamada</a></div>
</div>
""".format(home=link("inicio", single), nav=nav, drawer=drawer,
           book=link("agendar", single))


def ribbon(single, title="Ocho dueños por casa. <em>Ni uno más.</em>",
           text="Una llamada de cuarenta y cinco minutos basta para saber si el modelo le conviene. Si no le conviene, se lo decimos en esa misma llamada."):
    return """<section class="ribbon">
  <div class="wrap">
    <div><h2>%s</h2><p>%s</p></div>
    <a class="btn" href="%s">Agendar llamada de calificación <span class="arw">&rarr;</span></a>
  </div>
</section>
""" % (title, text, link("agendar", single))


def footer(single):
    cols = "".join(
        '<div><h4>%s</h4><ul>%s</ul></div>' % (
            head, "".join('<li><a href="%s"%s>%s</a></li>'
                          % (link(s, single), ' data-nav' if single else '', t)
                          for s, t in items))
        for head, items in FOOTNAV)
    return """<footer>
  <div class="wrap">
    <div class="footnav">{cols}</div>
    <div class="foot-grid">
      <div class="foot-brand">
        <b>La Fracción &mdash; Nayarit</b>
        <span class="folio">Copropiedad fraccional escriturada &middot; Riviera Nayarit, México</span>
      </div>
      <div class="foot-brand">
        <span class="folio">Contacto</span>
        <p style="font-family:var(--mono); font-size:.8rem; margin-top:6px">Nuevo Vallarta, Nayarit<br>hola@fractional-travel-investing.com</p>
      </div>
    </div>
    <p class="disclaimer">Aviso: la información de este sitio tiene fines informativos y no constituye una oferta pública de valores, asesoría de inversión, fiscal o legal. Las cifras de rendimiento, plusvalía y ocupación son estimaciones ilustrativas basadas en supuestos de mercado y no garantizan resultados futuros; el valor de un inmueble puede disminuir. Toda operación se formaliza mediante escritura pública ante notario mexicano y se rige por el memorándum informativo y el reglamento de copropiedad correspondientes, documentos que prevalecen sobre cualquier contenido de esta página. Consulte a su asesor fiscal y legal antes de invertir.</p>
  </div>
</footer>
""".format(cols=cols)


def pagehead(title, lede, crumbs, single):
    trail = "".join('<a href="%s">%s</a><span>/</span>'
                    % (link(s, single), t) for s, t in crumbs)
    return """<section class="pagehead">
  <div class="wrap">
    <nav class="crumbs">%s<span style="opacity:1">%s</span></nav>
    <h1>%s</h1>
    <p class="lede measure">%s</p>
  </div>
</section>
""" % (trail, title, title, lede)


def leadform(ident="lead"):
    return """<form data-lead id="%s">
  <div class="field-row">
    <div class="field"><label for="%s-n">Nombre completo</label><input id="%s-n" name="nombre" type="text" placeholder="Como aparece en su identificación" required></div>
    <div class="field"><label for="%s-p">WhatsApp</label><input id="%s-p" name="telefono" type="tel" placeholder="+52 322 000 0000" required></div>
  </div>
  <div class="field"><label for="%s-m">Correo electrónico</label><input id="%s-m" name="email" type="email" placeholder="nombre@dominio.com" required></div>
  <div class="field">
    <label for="%s-t">Rango de inversión considerado</label>
    <select id="%s-t" name="ticket" required>
      <option value="">Seleccione un rango</option>
      <option>Menos de USD $100,000</option>
      <option>USD $100,000 &ndash; $180,000</option>
      <option>USD $180,000 &ndash; $300,000</option>
      <option>Más de USD $300,000</option>
    </select>
  </div>
  <div class="field">
    <label for="%s-w">Cuándo le gustaría escriturar</label>
    <select id="%s-w" name="horizonte" required>
      <option value="">Seleccione un plazo</option>
      <option>En los próximos 90 días</option>
      <option>Este año</option>
      <option>El próximo año</option>
      <option>Todavía estoy explorando</option>
    </select>
  </div>
  <button class="btn" type="submit">Solicitar la llamada <span class="arw">&rarr;</span></button>
  <p class="form-fine">Al enviar, un asesor de La Fracción le contactará por WhatsApp en menos de 24 horas hábiles para confirmar el horario. No compartimos sus datos con terceros ni le inscribimos a ninguna lista de correo.</p>
  <p class="form-ok">Solicitud registrada. Le escribimos por WhatsApp para confirmar el horario.</p>
</form>""" % ((ident,) * 11)


# ---------------------------------------------------------------- bloques

def tabla_comparativa():
    return """<div class="tablewrap">
  <table>
    <thead><tr><th></th><th class="us">Fracción escriturada</th><th>Tiempo compartido</th><th>Casa completa</th><th>Renta vacacional</th></tr></thead>
    <tbody>
      <tr><th scope="row">Qué posee</th><td class="us">1/8 indiviso del inmueble, en escritura pública</td><td>Un derecho de uso contractual</td><td>El 100% del inmueble</td><td>Nada</td></tr>
      <tr><th scope="row">Aparece en su patrimonio</th><td class="us"><span class="mark yes">Sí</span><span>Como activo inmobiliario</span></td><td><span class="mark no">No</span></td><td><span class="mark yes">Sí</span></td><td><span class="mark no">No</span></td></tr>
      <tr><th scope="row">Captura plusvalía</th><td class="us"><span class="mark yes">Sí</span><span>Proporcional a su fracción</span></td><td><span class="mark no">No</span><span>El derecho se deprecia</span></td><td><span class="mark yes">Sí</span><span>Íntegra</span></td><td><span class="mark no">No</span></td></tr>
      <tr><th scope="row">Costo de entrada</th><td class="us"><span class="num">USD $120k &ndash; $220k</span></td><td><span class="num">USD $25k &ndash; $60k</span></td><td><span class="num">USD $960k &ndash; $1.8M</span></td><td><span class="num">$0</span></td></tr>
      <tr><th scope="row">Costo fijo anual</th><td class="us">Cuota de operación proporcional, compensada por renta</td><td>Mantenimiento vitalicio, con incrementos anuales</td><td>Predial, seguro, personal, mantenimiento: <span class="num">100%</span> suyo</td><td>Ninguno</td></tr>
      <tr><th scope="row">Salida</th><td class="us">Venta o cesión de la fracción, como cualquier inmueble</td><td>Mercado secundario prácticamente inexistente</td><td>Venta del inmueble completo, plazos largos</td><td>Inmediata</td></tr>
      <tr><th scope="row">Trabajo que exige</th><td class="us">Ninguno. Administración profesional incluida</td><td>Reservar con meses de anticipación</td><td>Es un segundo empleo</td><td>Buscar disponibilidad cada año</td></tr>
    </tbody>
  </table>
</div>"""


PASOS = [
    ("Etapa 01", "Llamada de calificación", "Día 1",
     "Cuarenta y cinco minutos. Revisamos su horizonte de inversión, cuántas semanas usaría realmente al año y si el modelo le conviene. Si no le conviene, se lo decimos en esa misma llamada."),
    ("Etapa 02", "Selección de residencia y reserva", "Semanas 1 &ndash; 3",
     "Recorrido presencial o virtual de las residencias disponibles. Se firma carta de intención y se deposita el apartado en cuenta de garantía; es reembolsable durante el periodo de due diligence."),
    ("Etapa 03", "Due diligence y constitución", "Semanas 3 &ndash; 8",
     "Certificado de libertad de gravamen, avalúo, régimen de copropiedad, reglamento de uso y &mdash;si usted es extranjero&mdash; la constitución del fideicomiso bancario en zona restringida. Recibe el expediente completo antes de firmar."),
    ("Etapa 04", "Escrituración y entrega", "Semanas 8 &ndash; 12",
     "Firma ante notario, inscripción en el Registro Público de la Propiedad y asignación de su calendario del primer año. Las llaves y el acceso a la plataforma de reservas se entregan el mismo día."),
]


def bloque_pasos():
    rows = "".join(
        '<div class="step"><p class="step-n">%s</p><div><h3>%s</h3><p>%s</p></div>'
        '<p class="step-when">%s</p></div>' % (n, t, d, w)
        for n, t, w, d in PASOS)
    return '<div class="steps">%s</div>' % rows


def bloque_calculadora():
    return """<div class="calc">
  <div class="calc-controls">
    <div class="ctl"><label for="cValue"><span class="lname">Valor de la residencia</span><span class="lval num" id="vValue">$1,120,000</span></label><input type="range" id="cValue" min="800000" max="2400000" step="40000" value="1120000"></div>
    <div class="ctl"><label for="cFrac"><span class="lname">Fracciones que adquiere</span><span class="lval num" id="vFrac">1 / 8</span></label><input type="range" id="cFrac" min="1" max="4" step="1" value="1"></div>
    <div class="ctl"><label for="cUse"><span class="lname">Semanas que realmente usa</span><span class="lval num" id="vUse">4</span></label><input type="range" id="cUse" min="0" max="26" step="1" value="4"></div>
    <div class="ctl"><label for="cRate"><span class="lname">Tarifa promedio por noche</span><span class="lval num" id="vRate">$780</span></label><input type="range" id="cRate" min="380" max="1800" step="20" value="780"></div>
    <div class="ctl"><label for="cApp"><span class="lname">Plusvalía anual estimada</span><span class="lval num" id="vApp">5.0%</span></label><input type="range" id="cApp" min="0" max="10" step="0.5" value="5"></div>
  </div>
  <div class="ledger">
    <div class="ledger-h"><p class="folio">Estado anual estimado</p><p class="folio">USD</p></div>
    <div class="ledger-row"><span class="k">Inversión inicial (su fracción)</span><span class="v num" id="rInv">$140,000</span></div>
    <div class="ledger-row"><span class="k">Semanas asignadas al año</span><span class="v num" id="rWeeks">6.5</span></div>
    <div class="ledger-row"><span class="k">Semanas que libera a renta</span><span class="v num" id="rFree">2.5</span></div>
    <div class="ledger-row pos"><span class="k">Ingreso neto por renta <small>(tras 22% de administración)</small></span><span class="v num" id="rIncome">+$10,647</span></div>
    <div class="ledger-row neg"><span class="k">Cuota de operación proporcional <small>(predial, seguro, mantenimiento, personal)</small></span><span class="v num" id="rFees">&minus;$9,800</span></div>
    <div class="ledger-row pos"><span class="k">Plusvalía anual de su fracción</span><span class="v num" id="rApp">+$7,000</span></div>
    <div class="ledger-row"><span class="k">Valor de las noches que usted disfruta</span><span class="v num" id="rEnjoy">$21,840</span></div>
    <div class="ledger-row total"><span class="k">Rendimiento total del año</span><span class="v num" id="rTotal">+$29,687</span></div>
    <p class="ledger-note">Cifras ilustrativas, no una garantía de rendimiento. Supuestos: ocupación del 62% sobre las semanas liberadas, comisión de administración del 22%, cuota anual de operación equivalente al 7% del valor de la fracción. La plusvalía es una estimación de mercado y puede ser negativa. Solicite el memorándum con las cifras auditadas de cada residencia.</p>
  </div>
</div>"""


FAQS = [
    ("¿En qué se diferencia esto de un tiempo compartido?",
     "En el objeto de la compra. En un tiempo compartido usted adquiere un derecho de uso frente a una empresa; si esa empresa cambia de manos o quiebra, su derecho se vuelve discutible, y el mercado secundario es casi inexistente. Aquí usted adquiere una parte alícuota del inmueble mediante escritura pública inscrita. Puede rentarla, heredarla, hipotecarla o venderla, y su valor se mueve con el del inmueble, no con la salud de un operador."),
    ("¿Qué pasa si quiero salir en tres años?",
     "Vende su fracción como vendería cualquier inmueble. El reglamento otorga a los demás copropietarios un derecho de preferencia de 30 días al precio ofertado; si no lo ejercen, usted vende libremente a un tercero. Nosotros mantenemos una lista de espera por residencia y podemos gestionar la venta, pero no está obligado a usarla. La liquidez es menor que la de un instrumento financiero y mayor que la de una casa completa."),
    ("¿Y si otro copropietario deja de pagar la cuota?",
     "El reglamento contempla un fondo de reserva equivalente a seis meses de operación, precisamente para absorber ese hueco sin interrumpir el servicio. La fracción morosa acumula intereses y, superados 180 días, se activa la venta forzosa con derecho de preferencia para los copropietarios al corriente. Los demás nunca quedan obligados a cubrir la cuota ajena de forma permanente."),
    ("¿Cómo se reparten las semanas de Navidad y Semana Santa?",
     "Por rotación de prioridad, no por quién reserva primero. Cada año se sortea el orden de elección una sola vez y el año siguiente ese orden se invierte, de modo que en un ciclo de ocho años cada copropietario ocupa cada posición. Cada fracción tiene garantizadas dos semanas de alta temporada al año. El calendario se cierra en septiembre para el año siguiente."),
    ("Soy extranjero. ¿Puedo realmente ser dueño en la costa mexicana?",
     "Sí, a través de un fideicomiso bancario, que es el mecanismo estándar desde 1973 para propiedad extranjera dentro de la franja de 50 km del litoral. Una institución bancaria mexicana es fiduciaria y usted es fideicomisario: usa, renta, mejora, vende y hereda el inmueble. El fideicomiso se constituye por 50 años y es renovable. Nosotros lo gestionamos como parte de la Etapa 03 y su costo está desglosado en el memorándum."),
    ("¿Qué obligaciones fiscales me genera?",
     "Predial anual proporcional (incluido en la cuota de operación), ISR sobre el ingreso por renta que le corresponda, y ISR sobre la ganancia al momento de vender. La administradora emite CFDI y entrega la constancia anual. México tiene tratados para evitar la doble tributación con más de 60 países; conviene revisarlo con su asesor fiscal antes de firmar, y con gusto le compartimos la documentación que necesite para esa conversación."),
    ("¿Puedo financiar la compra de la fracción?",
     "Las fracciones se adquieren de contado en la mayoría de los casos. Existen esquemas de pago diferido a 12 y 24 meses con enganche del 40% para residencias en preventa, y algunos clientes financian con una línea contra activos en su país de origen. Lo revisamos en la llamada de calificación; no ofrecemos crédito hipotecario directo."),
    ("¿Puedo llevar invitados o prestar mi semana?",
     "Sí. Durante sus semanas la casa es suya: puede ir, prestarla a familia o amigos, o cederla. El único límite es el aforo máximo que fija el reglamento por razones de seguro y de desgaste, y el registro de huéspedes que pide la administradora. Rentar su semana por su cuenta a terceros sí requiere avisar, para que el seguro y la limpieza queden cubiertos."),
    ("¿Qué pasa si quiero usar más semanas de las que me tocan?",
     "Se pueden tomar semanas no reclamadas por los demás copropietarios pagando sólo la tarifa de costo operativo, muy por debajo de la tarifa de renta. Se liberan en octubre, una vez cerrado el calendario. En la práctica siempre sobran semanas de temporada baja."),
    ("¿Quién responde si algo se rompe?",
     "La administradora, con cargo al fondo de mantenimiento que ya está dentro de su cuota anual. Usted no gestiona proveedores ni adelanta dinero. Los daños atribuibles a una estancia concreta se cargan al depósito de esa estancia, según el reglamento."),
]


def bloque_faq(limit=None):
    items = FAQS if limit is None else FAQS[:limit]
    rows = "".join(
        '<details%s><summary><span class="q">P.%02d</span><span class="t">%s</span>'
        '<span class="s">+</span></summary><p class="a">%s</p></details>'
        % (" open" if i == 0 else "", i + 1, q, a)
        for i, (q, a) in enumerate(items))
    return '<div class="faq">%s</div>' % rows


# ---------------------------------------------------------------- testimonios
# Textos de muestra: cada tarjeta lleva el distintivo "Muestra" y se
# sustituye por testimonios verificados antes de publicar.
TESTI_FEATURE = dict(
    quote=("Comparé una casa completa en Punta de Mita contra esto durante casi un año. "
           "Lo que me decidió no fue el precio: fue darme cuenta de que iba a usarla seis "
           "semanas y pagar cincuenta y dos."),
    name="Nombre del copropietario", where="Residencia Marea &middot; Ciudad", since="Copropietario desde 2024")

TESTIMONIOS = [
    dict(quote="El primer calendario me daba miedo. Elegí tercero, me tocó Semana Santa, y al año siguiente elegí sexto y también salí bien. La rotación funciona.",
         name="Nombre", where="Villa Sayulita Alta &middot; 2023"),
    dict(quote="El reporte de renta llega el día 10 de cada trimestre, con el detalle de noches y tarifas. No he tenido que perseguir a nadie por un número.",
         name="Nombre", where="Residencia Marea &middot; 2024"),
    dict(quote="Vendí media fracción el año pasado a un conocido. Escritura, notario y quince días. Eso es lo que no existe en un tiempo compartido.",
         name="Nombre", where="Penthouse Nayar &middot; 2022"),
    dict(quote="Llegamos con dos niños y la casa estaba lista: despensa, toallas, la alberca templada. No tuve que llamar a nadie.",
         name="Nombre", where="Residencia Marea &middot; 2023"),
    dict(quote="Lo que más pesó fue el fideicomiso. Mi contador en Chicago lo revisó y quedó tranquilo, y eso destrabó la decisión.",
         name="Nombre", where="Villa Sayulita Alta &middot; 2024"),
    dict(quote="Uso cuatro de mis seis semanas y las otras dos se rentan. El año pasado la renta cubrió la cuota completa y sobró.",
         name="Nombre", where="Penthouse Nayar &middot; 2023"),
]


def bloque_testimonios(n=3, featured=True):
    out = []
    if featured:
        out.append("""<div class="testi-feature">
  %s
  <div>
    <span class="sample">Muestra &mdash; sustituir por testimonio verificado</span>
    <blockquote style="margin-top:14px">%s</blockquote>
    <div class="testi-meta"><span class="name">%s</span><span class="where">%s</span><span class="since">%s</span></div>
  </div>
</div>""" % (holder("r45", "Retrato del copropietario", "4:5 &middot; 1200×1500"),
             TESTI_FEATURE["quote"], TESTI_FEATURE["name"],
             TESTI_FEATURE["where"], TESTI_FEATURE["since"]))
    cards = "".join("""<figure class="testi">
  <span class="sample">Muestra</span>
  <blockquote>%s</blockquote>
  <figcaption class="who">%s<span><span class="n">%s</span><span class="s">%s</span></span></figcaption>
</figure>""" % (t["quote"], holder("", "Foto", ""), t["name"], t["where"])
        for t in TESTIMONIOS[:n])
    out.append('<div class="testi-grid">%s</div>' % cards)
    return "\n".join(out)


# ---------------------------------------------------------------- páginas

def p_inicio(single):
    tarjetas = "".join("""<article class="res">
  %s
  <div class="res-body">
    <p class="res-loc">%s</p>
    <h3>%s</h3>
    <div class="res-specs"><span>%s</span><span>%s</span><span>%s</span></div>
    <div class="res-price">
      <div><p class="l">Fracción 1/8 desde</p><p class="p num">$%s</p></div>
      <div class="r"><p class="l">Disponibles</p><b class="num">%d de 8</b></div>
    </div>
    <a class="btn btn-ghost btn-sm" href="%s" style="justify-content:center">Ver la residencia <span class="arw">&rarr;</span></a>
  </div>
</article>""" % (holder("r43", "Fachada &mdash; " + r["name"], "4:3 &middot; 1600×1200"),
                 r["loc"], r["name"], r["m2"], r["rec"], r["specs"][0],
                 format(r["frac"], ","), 8 - r["sold"], link(r["slug"], single))
        for r in RESIDENCIAS)

    return """<section class="hero sec" id="top">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Nuevo Vallarta &middot; Bucerías &middot; Sayulita</p>
      <h1>La casa frente al mar, dividida entre ocho. La escritura, <em>a su nombre.</em></h1>
      <p class="lede measure">Copropiedad fraccional de residencias de lujo en Riviera Nayarit desde <span class="num">USD&nbsp;$120,000</span>. Seis semanas de uso al año, renta administrada el resto del tiempo, y una participación real en la plusvalía del inmueble. <strong>No es tiempo compartido. No son puntos. No es una membresía.</strong></p>
      <div class="hero-cta">
        <a class="btn" href="{book}">Agendar llamada de calificación <span class="arw">&rarr;</span></a>
        <a class="btn btn-ghost" href="{inv}">Ver el modelo económico</a>
      </div>
      <div class="trustbar">
        <div><b>8</b> copropietarios máximo</div>
        <div><b>1/8</b> indiviso escriturado</div>
        <div><b>6.5</b> semanas al año</div>
        <div><b>0</b> cuotas de por vida</div>
      </div>
    </div>

    <div class="deed">
      <div class="deed-top">
        <div><p class="folio">Folio de copropiedad</p><p class="deed-title">Residencia Marea</p></div>
        <p class="folio" id="deedRef">NAY&mdash;0<span class="num">1</span>/08</p>
      </div>
      <div class="shares" id="shares" data-unit="140000" role="img" aria-label="Ocho fracciones de la residencia; las suyas aparecen en latón"></div>
      <div class="shares-legend"><span>La residencia, en ocho partes</span><span><b id="mineLabel">1 fracción suya</b></span></div>
      <div class="frac-pick" role="group" aria-label="Número de fracciones">
        <button type="button" data-f="1" aria-pressed="true">1/8</button>
        <button type="button" data-f="2" aria-pressed="false">2/8</button>
        <button type="button" data-f="3" aria-pressed="false">3/8</button>
        <button type="button" data-f="4" aria-pressed="false">4/8</button>
      </div>
      <div class="weeks-block">
        <p class="folio">Su calendario &mdash; <span class="num">52</span> semanas del año</p>
        <div class="weeks" id="weeks" role="img" aria-label="Cinta de 52 semanas con las semanas asignadas a su fracción"></div>
        <div class="weeks-key"><span><i class="k-brass"></i>Uso propio</span><span><i class="k-verd"></i>Alta temporada</span><span><i class="k-idle"></i>Renta administrada</span></div>
      </div>
      <dl class="deed-figures">
        <div class="fig"><dt>Su inversión</dt><dd class="num" id="figInv">$140,000</dd></div>
        <div class="fig"><dt>Semanas al año</dt><dd class="num" id="figWeeks">6.5<small>2 en alta temporada</small></dd></div>
      </dl>
    </div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Las residencias</p></div>
      <div><h2>Tres casas. <em>Veinticuatro fracciones.</em></h2>
      <p class="lede measure" style="margin-top:16px">Cada casa se cierra en ocho copropietarios y no se abre de nuevo. No operamos inventario perpetuo.</p></div>
    </div>
    <div class="residences">{tarjetas}</div>
    <div style="margin-top:28px"><a class="btn btn-ghost" href="{res}">Ver las tres residencias <span class="arw">&rarr;</span></a></div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">El modelo</p></div>
      <div><h2>Cuatro maneras de tener una casa en la playa. <em>Sólo una tiene sentido.</em></h2>
      <p class="lede measure" style="margin-top:16px">La mayoría de las casas de descanso se usan entre cuatro y seis semanas al año. El resto del tiempo, el dueño paga por un inmueble vacío. La copropiedad fraccional corrige exactamente esa asimetría.</p></div>
    </div>
    {tabla}
    <div style="margin-top:28px"><a class="btn btn-ghost" href="{mod}">Cómo funciona, en detalle <span class="arw">&rarr;</span></a></div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Copropietarios</p></div>
      <div><h2>Quiénes ya <em>firmaron.</em></h2></div>
    </div>
    {testi}
    <div style="margin-top:28px"><a class="btn btn-ghost" href="{cop}">Leer a los copropietarios <span class="arw">&rarr;</span></a></div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Lo que firma</p></div>
      <div><h2>Lo que firma, <em>y lo que lo protege.</em></h2>
      <p class="lede measure" style="margin-top:16px">La diferencia entre una fracción y una promesa está en el papel.</p></div>
    </div>
    <div class="grid4">
      <div class="panel"><span class="folio">Instrumento I</span><h3>Escritura pública</h3><p>Copropiedad en régimen indiviso, inscrita en el Registro Público de la Propiedad de Nayarit.</p></div>
      <div class="panel"><span class="folio">Instrumento II</span><h3>Fideicomiso bancario</h3><p>Para copropietarios extranjeros, dentro de la franja costera de 50 km. Uso, renta, venta y sucesión plenos.</p></div>
      <div class="panel"><span class="folio">Instrumento III</span><h3>Reglamento de uso</h3><p>Rotación anual de prioridad y dos semanas de alta temporada garantizadas por fracción.</p></div>
      <div class="panel"><span class="folio">Instrumento IV</span><h3>Administración</h3><p>Cuenta bancaria separada por residencia y estado financiero trimestral.</p></div>
    </div>
    <div style="margin-top:28px"><a class="btn btn-ghost" href="{leg}">Ver la estructura legal completa <span class="arw">&rarr;</span></a></div>
  </div>
</section>
""".format(book=link("agendar", single), inv=link("inversion", single),
           res=link("residencias", single), mod=link("modelo", single),
           cop=link("copropietarios", single), leg=link("legal", single),
           tarjetas=tarjetas, tabla=tabla_comparativa(), testi=bloque_testimonios(3))


def p_residencias(single):
    filas = "".join("""<article class="res">
  %s
  <div class="res-body">
    <p class="res-loc">%s</p>
    <h3>%s</h3>
    <div class="res-specs"><span>%s</span><span>%s</span><span>%s</span></div>
    %s
    <div class="res-price">
      <div><p class="l">Fracción 1/8 desde</p><p class="p num">$%s</p></div>
      <div class="r"><p class="l">Valor total</p><b class="num">$%s</b></div>
    </div>
    <a class="btn btn-ghost btn-sm" href="%s" style="justify-content:center">Ver la ficha completa <span class="arw">&rarr;</span></a>
  </div>
</article>""" % (holder("r43", "Fachada &mdash; " + r["name"], "4:3 &middot; 1600×1200"),
                 r["loc"], r["name"], r["m2"], r["rec"], r["ban"], avail(r["sold"]),
                 format(r["frac"], ","), format(r["value"], ","), link(r["slug"], single))
        for r in RESIDENCIAS)

    return pagehead("Residencias", "Tres casas en Riviera Nayarit, cada una dividida en ocho fracciones escrituradas. Cuando una casa completa sus ocho copropietarios, se cierra: no volvemos a venderla.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec">
    <div class="residences">%s</div>
    <div class="note" style="margin-top:34px"><b>Las fotografías se cargan aquí.</b> Cada marco indica la toma y la proporción recomendada; al sustituirlo por una imagen real, la retícula no cambia.</div>
  </div>
</section>
""" % filas


def p_residencia(slug, single):
    r = RES_BY_SLUG[slug]
    gal = "".join(holder(cls, what, spec) for cls, what, spec in r["shots"])
    specs = "".join('<div class="specrow"><span class="k">%s</span><span class="v">%s</span></div>' % kv
                    for kv in [("Superficie", r["m2"]), ("Recámaras", r["rec"]),
                               ("Baños", r["ban"]),
                               ("Valor de la residencia", "USD $" + format(r["value"], ",")),
                               ("Fracción 1/8", "USD $" + format(r["frac"], ",")),
                               ("Cuota anual de operación", "USD $" + format(r["opex"], ",")),
                               ("Tarifa media por noche", "USD $" + format(r["rate"], ",")),
                               ("Semanas por fracción", "6.5 al año")])
    extras = "".join('<li>%s</li>' % s for s in r["specs"])

    return pagehead(r["name"], r["pitch"],
                    [("inicio", "Inicio"), ("residencias", "Residencias")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="gallery" style="margin-bottom:40px">%s</div>
    <div class="proplayout">
      <div class="prose">
        <h2>La casa</h2>
        <p style="margin-top:16px">%s</p>
        <h3>Qué incluye</h3>
        <ul>%s</ul>
        <h3>Cómo se reparte el año</h3>
        <p>Su fracción le asigna 6.5 semanas anuales, de las cuales dos caen en alta temporada por reglamento. El orden de elección rota cada año y se invierte al siguiente, de modo que en ocho años cada copropietario ocupa cada posición del turno. El calendario del año siguiente se cierra en septiembre.</p>
        <p>Las semanas que usted no reclama pasan a renta administrada, y el ingreso neto se le abona en el estado trimestral. Las semanas de temporada baja que nadie reclama quedan disponibles para los copropietarios a tarifa de costo operativo.</p>
        <div class="note"><b>Plano y memoria de calidades.</b> Se entregan en la llamada de calificación junto con el avalúo y el certificado de libertad de gravamen.</div>
      </div>
      <aside class="propaside">
        <div class="specsheet">
          <div class="specsheet-h"><p class="folio">Ficha técnica</p></div>
          %s
        </div>
        <div class="specsheet">
          <div class="specsheet-h"><p class="folio">Fracciones</p></div>
          <div style="padding:16px 18px">%s</div>
        </div>
        <a class="btn" href="%s" style="justify-content:center">Apartar una fracción <span class="arw">&rarr;</span></a>
        <a class="btn btn-ghost" href="%s" style="justify-content:center">Calcular el rendimiento</a>
      </aside>
    </div>
  </div>
</section>
""" % (gal, r["body"], extras, specs, avail(r["sold"]),
       link("agendar", single), link("inversion", single))


def p_modelo(single):
    return pagehead("Cómo funciona", "Ocho copropietarios, una escritura por fracción, un calendario que rota y una administradora que opera la casa. Todo lo demás es detalle de ese esquema.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="sec-head"><div class="rail"><p class="folio">Sección 01</p></div>
      <div><h2>Cuatro maneras de tener una casa en la playa. <em>Sólo una tiene sentido.</em></h2></div></div>
    %s
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Sección 02</p></div>
      <div><h2>De la primera llamada <em>a la escritura.</em></h2>
      <p class="lede measure" style="margin-top:16px">Un proceso de cuatro etapas, con notario público mexicano y due diligence documentada. Nada avanza sin su firma.</p></div></div>
    %s
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Sección 03</p></div>
      <div><h2>El calendario, <em>sin carrera por reservar.</em></h2></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Regla I</span><h3>Rotación de prioridad</h3><p>El orden de elección se sortea una vez y se invierte al año siguiente. En ocho años cada copropietario ocupa cada posición del turno. Nadie elige primero dos años seguidos.</p></div>
      <div class="panel"><span class="folio">Regla II</span><h3>Dos semanas de alta garantizadas</h3><p>Navidad, Año Nuevo, Semana Santa y los puentes largos se reparten por reglamento, no por rapidez. Cada fracción tiene dos semanas de alta temporada al año.</p></div>
      <div class="panel"><span class="folio">Regla III</span><h3>Semanas liberadas</h3><p>Lo que usted no reclama pasa a renta administrada y le genera ingreso. Lo que nadie reclama queda disponible para los copropietarios a tarifa de costo operativo.</p></div>
    </div>
    <div class="note" style="margin-top:28px"><b>El calendario se cierra en septiembre</b> para el año siguiente, y se publica en la plataforma de reservas el mismo día. A partir de ahí sólo cambia por intercambio entre copropietarios.</div>
  </div>
</section>
""" % (tabla_comparativa(), bloque_pasos())


def p_inversion(single):
    return pagehead("Los números", "Mueva las variables. La tabla se recalcula sobre supuestos conservadores de ocupación y tarifa para Riviera Nayarit, y todos los supuestos están escritos abajo.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">%s</div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Supuestos</p></div>
      <div><h2>De dónde salen <em>los números.</em></h2></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Ocupación 62%%</span><h3>Semanas liberadas</h3><p>Promedio conservador para renta vacacional administrada en Riviera Nayarit, contando temporada alta y baja. Las casas frente a playa suelen quedar por encima.</p></div>
      <div class="panel"><span class="folio">Comisión 22%%</span><h3>Administración</h3><p>Cubre canales de reserva, limpieza entre estancias, recepción de huéspedes, mantenimiento correctivo y reporte trimestral.</p></div>
      <div class="panel"><span class="folio">Cuota 7%%</span><h3>Operación anual</h3><p>Sobre el valor de su fracción: predial, seguro, mantenimiento preventivo, personal, jardinería, alberca y fondo de reserva.</p></div>
    </div>
    <div class="note" style="margin-top:28px"><b>Estas cifras son ilustrativas.</b> No son una garantía de rendimiento y la plusvalía puede ser negativa. El memorándum de cada residencia trae las cifras auditadas del ejercicio anterior; se entrega en la llamada de calificación.</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Comparación</p></div>
      <div><h2>La pregunta que <em>realmente</em> importa</h2>
      <p class="lede measure" style="margin-top:16px">No es cuánto rinde la fracción. Es cuánto le cuesta hoy la alternativa que ya está usando.</p></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Alternativa A</span><h3>Rentar cada año</h3><p>Seis semanas al año en casas equivalentes, a tarifa de mercado, son un gasto que no deja nada. En diez años supera con holgura el valor de una fracción, y usted sigue sin poseer nada.</p></div>
      <div class="panel"><span class="folio">Alternativa B</span><h3>Comprar la casa entera</h3><p>Ocho veces el capital inmovilizado, el 100%% de los costos fijos y un inmueble vacío cuarenta y seis semanas al año, salvo que usted quiera dedicarse a administrarlo.</p></div>
      <div class="panel"><span class="folio">Alternativa C</span><h3>La fracción</h3><p>Un octavo del capital, un octavo de los costos, las mismas seis semanas y un activo escriturado que puede vender. La diferencia la absorbe la renta administrada.</p></div>
    </div>
  </div>
</section>
""" % bloque_calculadora()


def p_legal(single):
    return pagehead("Estructura legal", "La diferencia entre una fracción y una promesa está en el papel. Estos son los instrumentos que sostienen la operación, y lo que cada uno le garantiza.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="legal-grid">
      <div class="legal-cell"><span class="folio">Instrumento I</span><h3>Escritura pública ante notario</h3><p>Su fracción se transmite mediante escritura de copropiedad en régimen indiviso, inscrita en el Registro Público de la Propiedad del Estado de Nayarit. Es un derecho real, oponible frente a terceros, heredable y transmisible.</p></div>
      <div class="legal-cell"><span class="folio">Instrumento II</span><h3>Fideicomiso bancario en zona restringida</h3><p>La costa mexicana está dentro de la franja de 50 km que la Constitución reserva. Si usted no es mexicano, su fracción se aloja en un fideicomiso con una institución bancaria mexicana como fiduciaria: usted es fideicomisario, con pleno derecho de uso, renta, venta y sucesión.</p></div>
      <div class="legal-cell"><span class="folio">Instrumento III</span><h3>Reglamento de uso y calendario</h3><p>Rotación anual de prioridad: quien elige primero un año, elige último el siguiente. Dos semanas de alta temporada garantizadas por fracción, límite de huéspedes, política de mascotas y depósito de daños. Todo escrito antes de que usted firme.</p></div>
      <div class="legal-cell"><span class="folio">Instrumento IV</span><h3>Administración y cuentas separadas</h3><p>Una sociedad administradora opera la casa, la renta y la reporta. Cuenta bancaria independiente por residencia, estado financiero trimestral, y derecho de los copropietarios a remover al administrador por mayoría. Sin cuotas vitalicias ni renovaciones automáticas.</p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Escenarios</p></div>
      <div><h2>Qué pasa <em>cuando algo sale mal.</em></h2>
      <p class="lede measure" style="margin-top:16px">Ninguna estructura vale por lo que promete en el escenario bueno. Estos son los cuatro casos incómodos y cómo los resuelve el reglamento.</p></div></div>
    <div class="grid2">
      <div class="panel"><span class="folio">Caso 01</span><h3>Un copropietario deja de pagar</h3><p>El fondo de reserva, equivalente a seis meses de operación, absorbe el hueco sin interrumpir el servicio. La fracción morosa acumula intereses y, superados 180 días, se activa la venta forzosa con derecho de preferencia para los copropietarios al corriente. Nadie queda obligado a cubrir la cuota ajena de forma permanente.</p></div>
      <div class="panel"><span class="folio">Caso 02</span><h3>Usted quiere salir</h3><p>Vende su fracción como cualquier inmueble. Los demás copropietarios tienen derecho de preferencia de 30 días al precio ofertado; si no lo ejercen, usted vende libremente. Mantenemos lista de espera por residencia, pero usarla es opcional.</p></div>
      <div class="panel"><span class="folio">Caso 03</span><h3>La administradora deja de servir</h3><p>Los copropietarios pueden removerla por mayoría simple, con 90 días de aviso. Las cuentas de la residencia son independientes de la administradora y no forman parte de su patrimonio; un concurso mercantil de la administradora no alcanza al inmueble ni a los fondos.</p></div>
      <div class="panel"><span class="folio">Caso 04</span><h3>Un copropietario fallece</h3><p>La fracción pasa a sus herederos por sucesión ordinaria, o al fideicomisario sustituto designado en el fideicomiso, que es la vía más rápida. Los herederos entran al reglamento en las mismas condiciones. La operación de la casa no se detiene.</p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Fiscal</p></div>
      <div><h2>Lo que le pide <em>el fisco.</em></h2></div></div>
    <div class="proplayout">
      <div class="prose">
        <p>Tres obligaciones, ninguna sorpresiva:</p>
        <ul>
          <li><strong>Predial anual proporcional.</strong> Ya viene dentro de la cuota de operación; usted no lo tramita.</li>
          <li><strong>ISR sobre el ingreso por renta</strong> que le corresponda. La administradora emite CFDI y entrega la constancia anual con el desglose de su fracción.</li>
          <li><strong>ISR sobre la ganancia al vender.</strong> Se calcula ante notario en el momento de la escritura de venta, con las deducciones que la ley permite.</li>
        </ul>
        <p>México tiene tratados para evitar la doble tributación con más de sesenta países. Si usted tributa fuera de México, conviene revisar el suyo con su asesor antes de firmar; le entregamos toda la documentación que necesite para esa conversación.</p>
        <div class="note"><b>No damos asesoría fiscal.</b> Damos los documentos para que su asesor la dé. Es una distinción importante y la sostenemos.</div>
      </div>
      <aside class="propaside">
        <div class="specsheet">
          <div class="specsheet-h"><p class="folio">Expediente que recibe</p></div>
          <div class="specrow"><span class="k">Certificado de libertad de gravamen</span><span class="v">Etapa 03</span></div>
          <div class="specrow"><span class="k">Avalúo bancario</span><span class="v">Etapa 03</span></div>
          <div class="specrow"><span class="k">Régimen de copropiedad</span><span class="v">Etapa 03</span></div>
          <div class="specrow"><span class="k">Reglamento de uso</span><span class="v">Etapa 03</span></div>
          <div class="specrow"><span class="k">Contrato de fideicomiso</span><span class="v">Etapa 03</span></div>
          <div class="specrow"><span class="k">Escritura inscrita</span><span class="v">Etapa 04</span></div>
        </div>
        <a class="btn" href="%s" style="justify-content:center">Pedir el expediente modelo <span class="arw">&rarr;</span></a>
      </aside>
    </div>
  </div>
</section>
""" % link("agendar", single)


def p_copropietarios(single):
    return pagehead("Copropietarios", "Ocho personas por casa que no se conocían y comparten una escritura. Esto es lo que dicen, y lo que pueden esperar del primer año.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    %s
    <div class="note" style="margin-top:32px"><b>Los textos de arriba son de muestra.</b> Marcan el tono, la extensión y la información que debe llevar cada testimonio: la comparación que hizo, qué lo decidió y cómo resultó. Se sustituyen por testimonios verificados, con nombre, ciudad, residencia y año de entrada.</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">El primer año</p></div>
      <div><h2>Qué pasa <em>después de firmar.</em></h2></div></div>
    <div class="steps">
      <div class="step"><p class="step-n">Mes 01</p><div><h3>Entrega y alta</h3><p>Llaves, acceso a la plataforma de reservas y alta en el grupo de copropietarios de su residencia. Se le asigna su turno de elección para el calendario en curso.</p></div><p class="step-when">Escrituración</p></div>
      <div class="step"><p class="step-n">Mes 02</p><div><h3>Primera estancia</h3><p>La casa se prepara con la despensa y las preferencias que usted deje registradas. La administradora recibe y entrega; usted no gestiona nada.</p></div><p class="step-when">A su elección</p></div>
      <div class="step"><p class="step-n">Mes 04</p><div><h3>Primer estado trimestral</h3><p>Noches rentadas, tarifas obtenidas, gastos del trimestre, saldo del fondo de reserva y el neto que le corresponde. Llega el día 10 del mes siguiente al cierre.</p></div><p class="step-when">Trimestral</p></div>
      <div class="step"><p class="step-n">Mes 09</p><div><h3>Cierre del calendario</h3><p>En septiembre elige sus semanas del año siguiente en el turno que le toca. El orden se invierte respecto del año anterior.</p></div><p class="step-when">Septiembre</p></div>
      <div class="step"><p class="step-n">Mes 12</p><div><h3>Asamblea anual</h3><p>Presupuesto del año siguiente, cuota de operación, obras mayores si las hay y ratificación o remoción de la administradora. Un voto por fracción.</p></div><p class="step-when">Diciembre</p></div>
    </div>
  </div>
</section>
""" % bloque_testimonios(6)


def p_nosotros(single):
    equipo = "".join("""<div class="person">%s<div><h3>%s</h3><p class="role">%s</p></div><p>%s</p></div>"""
        % (holder("r45", "Retrato", "4:5 &middot; 1200×1500"), n, r, d)
        for n, r, d in [
            ("Nombre y apellido", "Dirección general",
             "Responsable de la selección de inmuebles y de la relación con los copropietarios. Sustituya este texto por la biografía real: años en la plaza, operaciones cerradas y por qué está en esto."),
            ("Nombre y apellido", "Dirección de operación",
             "A cargo de la administradora: calendario, mantenimiento, renta y estados trimestrales. La biografía real debe incluir la experiencia previa en hospitalidad o administración de propiedades."),
            ("Nombre y apellido", "Dirección jurídica",
             "Coordina notarios, fideicomisos y due diligence de cada residencia. Indique cédula profesional y despacho de respaldo si lo hay: en esta industria pesa mucho."),
            ("Nombre y apellido", "Relación con inversionistas",
             "Atiende las llamadas de calificación y acompaña el proceso hasta la escritura. Es la persona con la que hablará primero cualquier interesado."),
        ])
    return pagehead("Quiénes somos", "Una operación pequeña, con nombre y cara. En un producto que se apoya en la confianza, saber con quién firma es parte de la due diligence.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="grid4">%s</div>
    <div class="note" style="margin-top:32px"><b>Sustituya los retratos y las biografías.</b> Cuatro fotos verticales, mismo encuadre y misma luz para las cuatro: la coherencia del retrato comunica más seriedad que cualquier adjetivo del texto.</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Aliados</p></div>
      <div><h2>Con quién <em>trabajamos.</em></h2>
      <p class="lede measure" style="margin-top:16px">Ninguna de estas funciones es interna, y así debe ser: el notario, el banco fiduciario y el valuador tienen que ser independientes de quien le vende.</p></div></div>
    <div class="grid4">
      <div class="panel"><span class="folio">Notaría</span><h3>Notaría pública</h3><p>Número y titular de la notaría que escritura las operaciones. Va aquí, con su número de registro.</p></div>
      <div class="panel"><span class="folio">Fiduciario</span><h3>Institución bancaria</h3><p>Banco que actúa como fiduciario en los fideicomisos de zona restringida.</p></div>
      <div class="panel"><span class="folio">Valuación</span><h3>Perito valuador</h3><p>Despacho independiente que emite el avalúo de cada residencia antes de abrir sus fracciones.</p></div>
      <div class="panel"><span class="folio">Seguro</span><h3>Aseguradora</h3><p>Póliza de daños y responsabilidad civil por residencia, con los copropietarios como beneficiarios.</p></div>
    </div>
    <div class="grid4" style="margin-top:22px">%s</div>
  </div>
</section>
""" % (equipo, "".join(holder("r169", "Logotipo del aliado", "16:9", "plain") for _ in range(4)))


POSTS = [
    ("Cómo leer un estado trimestral de renta", "Marzo 2026",
     "Qué mirar primero, qué partidas suelen esconder cargos duplicados y cuál es la tarifa media que debería esperar por temporada en Bahía de Banderas."),
    ("Fideicomiso: lo que su contador va a preguntar", "Febrero 2026",
     "Las seis preguntas que hace todo contador extranjero la primera vez que ve un fideicomiso mexicano, con la respuesta y el artículo que la sostiene."),
    ("Por qué cerramos las casas en ocho y no en doce", "Enero 2026",
     "Doce fracciones abaratan el ticket y arruinan el calendario. La aritmética de por qué ocho es el punto donde el modelo todavía sirve al copropietario."),
    ("Temporada alta en Riviera Nayarit: el calendario real", "Diciembre 2025",
     "Semana por semana, cuándo sube la tarifa y cuándo baja la ocupación. Sirve tanto para elegir sus semanas como para estimar la renta de las que libera."),
    ("Qué revisa un avalúo y qué no", "Noviembre 2025",
     "El avalúo bancario no es una opinión de mercado ni una inspección estructural. Qué documento cubre cada cosa y cuál debe exigir antes de firmar."),
]


def p_diario(single):
    filas = "".join("""<a class="post" href="%s">%s<div><h3>%s</h3><p>%s</p></div><p class="when">%s</p></a>"""
        % (link("diario", single), holder("r32", "Imagen del artículo", "3:2"), t, d, w)
        for t, w, d in POSTS)
    return pagehead("Diario", "Notas de operación, no marketing. Lo que aprendemos administrando las casas y cerrando escrituras, publicado para que usted pregunte mejor.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div style="border-top:var(--rule)">%s</div>
    <div class="note" style="margin-top:32px"><b>Los artículos son títulos de trabajo.</b> Sustituya cada uno por el texto real; la plantilla de artículo hereda los estilos de <code>.prose</code> de este mismo sistema.</div>
  </div>
</section>
"""  % filas


def p_preguntas(single):
    return pagehead("Preguntas frecuentes", "Las preguntas incómodas primero. Si la suya no está aquí, hágala en la llamada: contestamos todas antes de que firme cualquier cosa.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">%s</div>
</section>
""" % bloque_faq()


def p_agendar(single):
    return """<section class="close-sec" id="agendar" style="border-top:none">
  <div class="wrap sec close-grid">
    <div>
      <p class="eyebrow">El siguiente paso</p>
      <h2 style="margin-top:14px">Cuarenta y cinco minutos <em>para saber si esto es para usted.</em></h2>
      <p class="lede" style="margin-top:18px; max-width:52ch">No es una llamada de ventas. Es una revisión de números con la persona que opera las residencias. Si el modelo no le conviene, terminamos la llamada diciéndoselo.</p>
      <div class="qualify">
        <p class="folio" style="margin-bottom:6px">Lo que revisamos en esa llamada</p>
        <ul>
          <li><span>01</span> Cuántas semanas al año usaría realmente, y si compensan el ticket.</li>
          <li><span>02</span> Su horizonte: por debajo de cinco años, el modelo rara vez funciona.</li>
          <li><span>03</span> Estructura fiscal según su residencia y nacionalidad.</li>
          <li><span>04</span> Qué residencia y qué fracción quedan disponibles hoy.</li>
        </ul>
      </div>
      <div class="qualify">
        <p class="folio" style="margin-bottom:6px">Lo que recibe después</p>
        <ul>
          <li><span>&mdash;</span> Memorándum de la residencia que le interese, con cifras del ejercicio anterior.</li>
          <li><span>&mdash;</span> Reglamento de uso y contrato de fideicomiso modelo.</li>
          <li><span>&mdash;</span> Calendario de fracciones disponibles, actualizado a esa semana.</li>
        </ul>
      </div>
    </div>
    %s
  </div>
</section>
""" % leadform("agendar")


def p_avisos(single):
    return pagehead("Aviso legal y privacidad", "Qué es y qué no es este sitio, y qué hacemos con los datos que usted nos deja.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="prose measure">
      <h3>Naturaleza de la información</h3>
      <p>El contenido de este sitio tiene fines informativos y promocionales. No constituye una oferta pública de valores, una invitación a invertir, ni asesoría de inversión, fiscal o legal. Ninguna cifra publicada aquí es una garantía de rendimiento.</p>
      <h3>Cifras y estimaciones</h3>
      <p>Los importes de renta, ocupación, cuotas y plusvalía son estimaciones ilustrativas construidas sobre supuestos de mercado que se declaran junto a cada cálculo. El valor de un inmueble puede disminuir y la ocupación puede resultar inferior a la estimada. Las cifras auditadas de cada residencia se entregan en el memorándum informativo correspondiente.</p>
      <h3>Documentos que prevalecen</h3>
      <p>Toda operación se formaliza mediante escritura pública ante notario mexicano. El memorándum informativo, el reglamento de copropiedad y el contrato de fideicomiso rigen la relación y prevalecen sobre cualquier contenido de esta página en caso de discrepancia.</p>
      <h3>Datos personales</h3>
      <p>Los datos que usted proporciona en los formularios se usan únicamente para contactarle en relación con su solicitud. No se venden, ceden ni transfieren a terceros con fines comerciales, y no se le inscribe a ninguna lista de correo sin su consentimiento expreso. Puede solicitar el acceso, la rectificación o la eliminación de sus datos escribiendo a la dirección de contacto del pie de página.</p>
      <h3>Propiedad intelectual</h3>
      <p>Las marcas, textos, fotografías y planos publicados en este sitio pertenecen a sus respectivos titulares y no pueden reproducirse sin autorización escrita.</p>
      <div class="note"><b>Antes de publicar:</b> sustituya esta plantilla por el aviso de privacidad completo que exige la LFPDPPP, con el nombre y domicilio del responsable, las finalidades del tratamiento y el procedimiento para ejercer derechos ARCO.</div>
    </div>
  </div>
</section>
"""


# ---------------------------------------------------------------- registro

PAGES = [
    ("inicio",     "Copropiedad fraccional en Riviera Nayarit",
     "Copropiedad fraccional escriturada de residencias frente al mar en Riviera Nayarit. Una octava parte de la casa, seis semanas al año, renta administrada el resto.", p_inicio, True),
    ("residencias", "Residencias",
     "Tres residencias en Nuevo Vallarta, Sayulita y Bucerías, cada una dividida en ocho fracciones escrituradas.", p_residencias, True),
    ("residencia-marea", "Residencia Marea",
     "Residencia frente de playa en Nuevo Vallarta. 240 m², tres recámaras, fracción 1/8 desde USD $140,000.",
     lambda s: p_residencia("residencia-marea", s), True),
    ("residencia-sayulita-alta", "Villa Sayulita Alta",
     "Villa en la colina de Sayulita. 185 m², tres recámaras, fracción 1/8 desde USD $120,000.",
     lambda s: p_residencia("residencia-sayulita-alta", s), True),
    ("residencia-nayar", "Penthouse Nayar",
     "Penthouse en Bucerías con doble vista a la bahía. 310 m², cuatro recámaras, fracción 1/8 desde USD $220,000.",
     lambda s: p_residencia("residencia-nayar", s), True),
    ("modelo", "Cómo funciona",
     "Ocho copropietarios, una escritura por fracción, un calendario que rota y una administradora que opera la casa.", p_modelo, True),
    ("inversion", "Los números",
     "Calculadora del modelo económico de una fracción, con los supuestos de ocupación, comisión y cuota declarados.", p_inversion, True),
    ("legal", "Estructura legal",
     "Escritura pública, fideicomiso bancario, reglamento de uso y administración con cuentas separadas.", p_legal, True),
    ("copropietarios", "Copropietarios",
     "Testimonios de copropietarios y qué esperar del primer año tras escriturar una fracción.", p_copropietarios, True),
    ("nosotros", "Quiénes somos",
     "El equipo que selecciona los inmuebles, opera las casas y coordina notarios y fideicomisos.", p_nosotros, True),
    ("diario", "Diario",
     "Notas de operación sobre copropiedad fraccional, fideicomisos y el mercado de Riviera Nayarit.", p_diario, True),
    ("preguntas", "Preguntas frecuentes",
     "Diez preguntas sobre copropiedad fraccional: salida, morosidad, calendario, fideicomiso y fiscalidad.", p_preguntas, False),
    ("agendar", "Agendar una llamada",
     "Llamada de calificación de cuarenta y cinco minutos para revisar si la copropiedad fraccional le conviene.", p_agendar, False),
    ("avisos", "Aviso legal y privacidad",
     "Naturaleza de la información publicada, tratamiento de datos personales y documentos que rigen la operación.", p_avisos, False),
]


def build():
    os.makedirs(os.path.join(HERE, "dist"), exist_ok=True)
    routes = []

    for slug, title, desc, fn, with_ribbon in PAGES:
        # --- página estática del hub ---
        body = fn(False)
        if with_ribbon:
            body += ribbon(False)
        html = (HEAD.format(title=title, desc=desc, root="")
                + topbar(slug, False) + body + footer(False)
                + TAIL.format(root=""))
        name = "index.html" if slug == "inicio" else slug + ".html"
        with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
            f.write(html)

        # --- misma página como ruta del previsualizador ---
        rbody = fn(True)
        if with_ribbon:
            rbody += ribbon(True)
        routes.append('<div class="route" data-route="/%s">%s</div>' % (slug, rbody))

    css = open(os.path.join(HERE, "assets/styles.css"), encoding="utf-8").read()
    js = open(os.path.join(HERE, "assets/site.js"), encoding="utf-8").read()
    preview = (
        '<title>La Fracción Nayarit</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
        'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400'
        '&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">\n'
        '<style>\n' + css + '\n</style>\n'
        + topbar("inicio", True)
        + "\n".join(routes)
        + footer(True)
        + '<script>\n' + js + '\n</script>\n')
    with open(os.path.join(HERE, "dist/preview.html"), "w", encoding="utf-8") as f:
        f.write(preview)

    print("%d páginas + dist/preview.html (%d KB)" % (len(PAGES), len(preview) // 1024))


if __name__ == "__main__":
    build()
