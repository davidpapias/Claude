#!/usr/bin/env python3
"""
Genera el sitio de Fractional Travel & Investing.

Un solo origen produce dos salidas:
  * las páginas estáticas del hub (index.html, residencias.html, …),
    que comparten assets/styles.css y assets/site.js;
  * dist/preview.html, un archivo único con todas las páginas como
    rutas de hash, para previsualizar el hub completo sin servidor.

    python3 build.py
"""
import hashlib, os, re

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
# ---------------------------------------------------------------- fraccional
# Anthus es el proyecto activo. Las cifras son marcadores: se sustituyen por
# las del proyecto real antes de publicar.
ANTHUS = dict(
    slug="anthus", name="Anthus",
    loc="[Ubicación del desarrollo]",
    unidades=12, liberadas=4, fracciones=8, vendidas=13,
    m2="[m²] por residencia", rec="[n] recámaras", ban="[n] baños",
    value=1120000, frac=140000, opex=9800, rate=780,
    entrega="[Fecha de entrega]",
    specs=["[Amenidad principal]", "[Amenidad]", "[Amenidad]",
           "[Acabados]", "[Estacionamiento]", "[Estatus de entrega]"],
    pitch=("Anthus es el desarrollo con el que abrimos la vertical de copropiedad. "
           "Cada residencia se divide en ocho fracciones escrituradas, y cada fracción "
           "da seis semanas y media de uso al año. Lo que no usa, entra al programa de "
           "rentas y le genera ingreso."),
    body=("Sustituya este párrafo por la descripción real del desarrollo: qué lo "
          "distingue de lo que hay alrededor, cómo está resuelta la planta, qué se ve "
          "desde las terrazas y qué queda a distancia caminando. Es el texto que "
          "convence a quien ya entendió el modelo y ahora quiere saber si la casa le gusta."),
    shots=[("r32", "Fachada del desarrollo", "3:2 &middot; 2400×1600"),
           ("r11", "Amenidad principal", "1:1 &middot; 1600×1600"),
           ("r11", "Sala y terraza", "1:1 &middot; 1600×1600"),
           ("r11", "Recámara principal", "1:1 &middot; 1600×1600"),
           ("r11", "Vista desde la unidad", "1:1 &middot; 1600×1600")])

FUTUROS = [
    ("Proyecto II", "[Plaza]", "En estructuración"),
    ("Proyecto III", "[Plaza]", "En análisis"),
]

RESIDENCIAS = [ANTHUS]

# ---------------------------------------------------------------- navegación
NAV = [("fractional", "Fraccional"), ("travel", "Travel"),
       ("investing", "Investing"), ("club", "Club"),
       ("servicios", "Servicios")]

NAV_EXTRA = [("anthus", "Anthus"), ("numeros", "Los números"),
             ("yates", "Yates"), ("rentas", "Rentas"),
             ("partner-agent", "Partner Agent"), ("legal", "Estructura legal"),
             ("memorandum", "Memorándum"), ("nosotros", "Nosotros"),
             ("diario", "Diario"), ("preguntas", "Preguntas")]

FOOTNAV = [
    ("Fraccional", [("fractional", "La división"), ("anthus", "Anthus"),
                    ("modelo", "Cómo funciona"), ("numeros", "Los números"),
                    ("memorandum", "El memorándum"), ("copropietarios", "Copropietarios")]),
    ("Travel", [("travel", "La división"), ("yates", "Flota de yates"),
                ("servicios", "Servicios")]),
    ("Investing", [("investing", "La división"), ("legal", "Estructura legal")]),
    ("Club y programas", [("club", "Club"), ("rentas", "Rentas"),
                          ("partner-agent", "Partner Agent")]),
    ("La casa", [("nosotros", "Quiénes somos"), ("diario", "Diario"),
                 ("preguntas", "Preguntas frecuentes"), ("agendar", "Hablar con alguien"),
                 ("avisos", "Aviso legal")]),
]


# ---------------------------------------------------------------- plantilla

HEAD = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} &middot; Fractional Travel &amp; Investing</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{root}assets/styles.css?v={cssv}">
</head>
<body>
"""

TAIL = """<script src="{root}assets/site.js?v={jsv}"></script>
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
        for s, t in NAV + NAV_EXTRA)
    return """<div class="topbar">
  <div class="wrap topbar-in">
    <a class="brand" href="{home}"><b>Fractional Travel <span class="amp">&amp;</span> Investing</b></a>
    <nav class="navlinks">{nav}</nav>
    <a class="btn btn-sm" href="{book}">Agendar llamada <span class="arw">&rarr;</span></a>
    <button class="navtoggle" type="button" aria-expanded="false">Menú</button>
  </div>
  <div class="navdrawer">{drawer}<a class="btn" href="{book}">Agendar llamada</a></div>
</div>
""".format(home=link("inicio", single), nav=nav, drawer=drawer,
           book=link("agendar", single))


RIBBONS = {
    "inicio": ("Tres vías de entrada. <em>Una conversación.</em>",
               "Cuéntenos qué busca y le decimos por cuál empezar, aunque acabe siendo ninguna.",
               "agendar", "Hablar con alguien"),

    "fractional": ("Ocho copropietarios por residencia. <em>Ni uno más.</em>",
                   "Empiece por el memorándum de Anthus: cifras auditadas del ejercicio anterior, sin llamada de por medio.",
                   "memorandum", "Descargar el memorándum"),
    "anthus": ("Quedan <em>{libres}</em> fracciones liberadas.",
               "Cuando una residencia completa sus ocho copropietarios, se cierra y no la volvemos a abrir.",
               "memorandum", "Ver las cifras de Anthus"),
    "modelo": ("Ya entiende el modelo. <em>Ahora los números.</em>",
               "La calculadora corre sobre supuestos declarados y editables, y termina en un escenario que le podemos mandar por escrito.",
               "numeros", "Calcular mi rendimiento"),
    "numeros": ("Los números cuadran. <em>¿Y la casa?</em>",
                "Anthus, con las fracciones liberadas y las cifras auditadas por separado.",
                "anthus", "Ver Anthus"),
    "memorandum": ("Cuando lo haya leído, <em>hablamos.</em>",
                   "Cuarenta y cinco minutos con quien opera las casas, y sólo si usted lo pide.",
                   "agendar", "Agendar la llamada"),
    "copropietarios": ("Ocho personas por residencia. <em>Falta usted.</em>",
                       "Cuarenta y cinco minutos con quien opera Anthus. Si el modelo no le conviene, se lo decimos ahí mismo.",
                       "agendar", "Agendar la llamada"),

    "travel": ("Lo que gasta viajando, <em>se le acredita.</em>",
               "Disponibilidad real y propuesta con precio cerrado, en el mismo día hábil.",
               "yates", "Ver la flota"),
    "yates": ("La bahía se ve mejor <em>desde el agua.</em>",
              "Díganos días, personas y qué le gustaría hacer. Cotizar no cuesta ni aparta la fecha.",
              "agendar", "Pedir disponibilidad"),

    "investing": ("Propiedad completa, <em>sin reglamento de uso.</em>",
                  "Plano, escritura, libertad de gravamen, avalúo y el historial de renta de las propiedades terminadas.",
                  "agendar", "Pedir la ficha"),

    "club": ("La membresía <em>se gana invirtiendo.</em>",
             "Escriturar en Fraccional o en Investing la activa el mismo día de la firma.",
             "agendar", "Hablar con alguien"),
    "servicios": ("La operación resuelve, <em>usted descansa.</em>",
                  "La misma capa está en las tres verticales. Pregunte por ella en la llamada.",
                  "agendar", "Hablar con alguien"),
    "rentas": ("Su propiedad vacía <em>cuesta dinero.</em>",
               "Le estimamos el ingreso anual con lo que rentan propiedades comparables que ya operamos.",
               "agendar", "Pedir la estimación"),
    "partner-agent": ("¿Tiene cartera? <em>Hablemos.</em>",
                      "Le mandamos el esquema de comisiones y el material de venta completo.",
                      "agendar", "Ver las condiciones"),

    "legal": ("Ya vio la estructura. <em>Pida el expediente.</em>",
              "Reglamento de uso, contrato de fideicomiso modelo y avalúo, en un solo correo.",
              "memorandum", "Pedir el expediente modelo"),
    "nosotros": ("Ya sabe con quién <em>firmaría.</em>",
                 "El siguiente paso natural es el papel: memorándum, reglamento y fideicomiso modelo.",
                 "memorandum", "Descargar el memorándum"),
    "diario": ("¿Le quedó una pregunta <em>sin contestar?</em>",
               "El memorándum contesta la mayoría, y no hay que hablar con nadie para leerlo.",
               "memorandum", "Descargar el memorándum"),
    "preguntas": ("¿Su pregunta no estaba? <em>Pregúntela.</em>",
                  "En la llamada se contestan todas antes de que firme nada.",
                  "agendar", "Hablar con alguien"),
}


def ribbon(slug, single):
    if slug not in RIBBONS:
        return ""
    title, text, dest, label = RIBBONS[slug]
    return """<section class="ribbon">
  <div class="wrap">
    <div><h2>%s</h2><p>%s</p></div>
    <a class="btn" href="%s">%s <span class="arw">&rarr;</span></a>
  </div>
</section>
""" % (title.replace("{libres}", str(TOTAL_LIBRES)), text, link(dest, single), label)


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
        <b>Fractional Travel &amp; Investing</b>
        <p class="foot-tagline">Own a piece of the places you love.</p>
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
  <p class="form-fine">Al enviar, un asesor de Fractional Travel &amp; Investing le contactará por WhatsApp en menos de 24 horas hábiles para confirmar el horario. No compartimos sus datos con terceros ni le inscribimos a ninguna lista de correo.</p>
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
    <div class="note" style="margin-top:6px"><b>Muévalos hasta que se parezca a su caso.</b> El renglón que más cambia el resultado es el de semanas que realmente usa: por debajo de cuatro, el modelo se sostiene en la renta; por encima de seis, en el uso. Las semanas que no usa se liberan solas a renta administrada.</div>
  </div>
  <div>
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
    <p class="ledger-note">Cifras ilustrativas, no una garantía de rendimiento. Supuestos: ocupación del 62% sobre las semanas liberadas, comisión de administración del 22%, cuota anual de operación equivalente al 7% del valor de la fracción. La plusvalía es una estimación de mercado y puede ser negativa.</p>
  </div>

  <div class="scenario">
    <div class="scenario-h">
      <h4>¿Le cuadra? Se lo mandamos con las cifras reales.</h4>
      <p>Tomamos exactamente los números que usted acaba de mover y los recalculamos contra el estado de resultados auditado de la residencia que elija. Llega por correo, sin llamada de por medio.</p>
    </div>
    <div class="scenario-b">
      <div class="f"><label for="scMail">Correo electrónico</label><input type="email" id="scMail" placeholder="nombre@dominio.com"></div>
      <div class="f"><label for="scTel">WhatsApp (opcional)</label><input type="tel" id="scTel" placeholder="+52 322 000 0000"></div>
      <button class="btn" type="button" id="scSend">Enviarme este escenario <span class="arw">&rarr;</span></button>
    </div>
    <p class="scenario-sum" id="sceneSum"></p>
  </div>
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

def p_fractional(single):
    return """<section class="hero sec" id="top">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">División Fraccional &middot; {loc}</p>
      <h1>La casa frente al mar, dividida entre ocho. La escritura, <em>a su nombre.</em></h1>
      <p class="tagline">Own a piece of the places you love.</p>
      <p class="lede measure">Copropiedad fraccional escriturada en <strong>Anthus</strong>, nuestro primer desarrollo. Una octava parte de la residencia, seis semanas y media de uso al año, y el resto del tiempo la rentamos por usted. <strong>No es tiempo compartido. No son puntos. No es una membresía.</strong></p>
      <div class="hero-cta">
        <a class="btn" href="{memo}">Descargar el memorándum <span class="arw">&rarr;</span></a>
        <a class="btn btn-ghost" href="{num}">Calcular mi rendimiento</a>
      </div>
      <p class="proof">Cifras auditadas del ejercicio anterior &middot; sin llamada de por medio &middot; <b>{libres}</b> de {tot} fracciones liberadas</p>
      <div class="trustbar">
        <div><b>8</b> copropietarios por residencia</div>
        <div><b>1/8</b> indiviso escriturado</div>
        <div><b>6.5</b> semanas al año</div>
        <div><b>0</b> cuotas de por vida</div>
      </div>
    </div>

    <div class="deed">
      <div class="deed-top">
        <div><p class="folio">Folio de copropiedad</p><p class="deed-title">Anthus</p></div>
        <p class="folio" id="deedRef">ANT&mdash;0<span class="num">1</span>/08</p>
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
      <div class="rail"><p class="folio">El desarrollo</p></div>
      <div><h2>Anthus, <em>y lo que viene después.</em></h2>
      <p class="lede measure" style="margin-top:16px">Cada residencia se cierra en ocho copropietarios y no se abre de nuevo. No operamos inventario perpetuo: cuando Anthus se llena, se cierra y abrimos el siguiente.</p></div>
    </div>
    <div class="proplayout">
      <div>
        {holder}
      </div>
      <aside class="propaside">
        <div class="specsheet">
          <div class="specsheet-h"><p class="folio">Anthus &mdash; {loc}</p></div>
          <div class="specrow"><span class="k">Residencias</span><span class="v">{unidades}</span></div>
          <div class="specrow"><span class="k">Fracción 1/8 desde</span><span class="v">USD ${frac}</span></div>
          <div class="specrow"><span class="k">Entrega</span><span class="v">{entrega}</span></div>
        </div>
        <div class="specsheet">
          <div class="specsheet-h"><p class="folio">Fracciones liberadas</p></div>
          <div style="padding:16px 18px">{avail}</div>
        </div>
        <a class="btn" href="{anthus}" style="justify-content:center">Ver Anthus <span class="arw">&rarr;</span></a>
      </aside>
    </div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Va incluido</p></div>
      <div><h2>Lo que no usa, <em>lo rentamos por usted.</em></h2>
      <p class="lede measure" style="margin-top:16px">En Fraccional el programa de rentas no se contrata: viene dentro del modelo. Las semanas de su fracción que no reclama pasan solas a renta administrada y el neto le llega en el estado trimestral.</p></div>
    </div>
    <div class="grid3">
      <div class="panel"><span class="folio">Automático</span><h3>Sin firmar nada aparte</h3><p>No hay contrato adicional, ni alta, ni cuota de entrada. Lo que no bloquea en septiembre entra a renta.</p></div>
      <div class="panel"><span class="folio">Su casa, su ingreso</span><h3>No hay fondo común</h3><p>Cobra lo que su residencia generó en sus semanas, no un promedio repartido entre copropietarios.</p></div>
      <div class="panel"><span class="folio">Trimestral</span><h3>Estado con CFDI</h3><p>Noches, tarifas obtenidas, gastos y neto. Transferencia el día 10 del mes siguiente al cierre.</p></div>
    </div>
    <div style="margin-top:26px"><a class="btn btn-ghost" href="{rentas}">Cómo funciona el programa de rentas <span class="arw">&rarr;</span></a></div>
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

{servicios}

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Para quién no</p></div>
      <div><h2>Cuatro razones para <em>no hacer esto.</em></h2>
      <p class="lede measure" style="margin-top:16px">Preferimos perderle aquí que en la escritura. Si se reconoce en alguna de estas cuatro, cierre la página con nuestra bendición.</p></div>
    </div>
    {notfor}
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Al escriturar</p></div>
      <div><h2>Invertir aquí <em>abre la puerta del Club.</em></h2></div>
    </div>
    <div class="gate div-club">
      <span class="seal" aria-hidden="true"></span>
      <div>
        <h3>Su fracción lo vuelve <em>elegible.</em></h3>
        <p>Al firmar la escritura queda habilitado para la membresía del Club: la plataforma Vacation Owners, con hoteles y resorts de todo el mundo a la mitad del costo público, más los servicios de viaje de la casa. No se vende por separado ni se abre a quien no ha invertido.</p>
        <p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="{club}">Ver qué incluye el Club <span class="arw">&rarr;</span></a></p>
      </div>
    </div>
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
      <div class="panel"><span class="folio">Instrumento I</span><h3>Escritura pública</h3><p>Copropiedad en régimen indiviso, inscrita en el Registro Público de la Propiedad.</p></div>
      <div class="panel"><span class="folio">Instrumento II</span><h3>Fideicomiso bancario</h3><p>Para copropietarios extranjeros, dentro de la franja costera de 50 km. Uso, renta, venta y sucesión plenos.</p></div>
      <div class="panel"><span class="folio">Instrumento III</span><h3>Reglamento de uso</h3><p>Rotación anual de prioridad y dos semanas de alta temporada garantizadas por fracción.</p></div>
      <div class="panel"><span class="folio">Instrumento IV</span><h3>Administración</h3><p>Cuenta bancaria separada por residencia y estado financiero trimestral.</p></div>
    </div>
    <div style="margin-top:28px"><a class="btn btn-ghost" href="{leg}">Ver la estructura legal completa <span class="arw">&rarr;</span></a></div>
  </div>
</section>

<section>
  <div class="wrap sec">{capture}</div>
</section>
""".replace("{loc}", ANTHUS["loc"]) \
   .replace("{memo}", link("memorandum", single)) \
   .replace("{num}", link("numeros", single)) \
   .replace("{libres}", str(TOTAL_LIBRES)).replace("{tot}", str(TOTAL_FRACCIONES)) \
   .replace("{holder}", holder("r32", "Anthus &mdash; fachada del desarrollo", "3:2 &middot; 2400×1600")) \
   .replace("{unidades}", str(ANTHUS["unidades"])) \
   .replace("{frac}", format(ANTHUS["frac"], ",")) \
   .replace("{entrega}", ANTHUS["entrega"]) \
   .replace("{avail}", avail(ANTHUS["vendidas"], TOTAL_FRACCIONES)) \
   .replace("{anthus}", link("anthus", single)) \
   .replace("{rentas}", link("rentas", single)) \
   .replace("{tabla}", tabla_comparativa()) \
   .replace("{mod}", link("modelo", single)) \
   .replace("{servicios}", bloque_servicios(single,
       "Su fracción no viene sola: la misma capa de servicios que opera la casa está "
       "disponible cuando usted la usa, y ya está dentro de la cuota anual.")) \
   .replace("{notfor}", notfor()) \
   .replace("{club}", link("club", single)) \
   .replace("{testi}", bloque_testimonios(3)) \
   .replace("{cop}", link("copropietarios", single)) \
   .replace("{leg}", link("legal", single)) \
   .replace("{capture}", mini_capture(
       "fracMemo", "Llévese <em>los números</em> antes de decidir nada.",
       "El memorándum de Anthus: estado de resultados del ejercicio anterior, ocupación real "
       "mes a mes, la cuota de operación partida renglón por renglón y el contrato de "
       "fideicomiso modelo. Es el documento que le va a pedir su contador.",
       "Enviarme el memorándum", fields="email"))


def p_anthus(single):
    r = ANTHUS
    gal = "".join(holder(cls, what, spec) for cls, what, spec in r["shots"])
    specs = "".join('<div class="specrow"><span class="k">%s</span><span class="v">%s</span></div>' % kv
                    for kv in [("Superficie por residencia", r["m2"]),
                               ("Recámaras", r["rec"]),
                               ("Baños", r["ban"]),
                               ("Residencias en el desarrollo", str(r["unidades"])),
                               ("Residencias liberadas", str(r["liberadas"])),
                               ("Fracciones por residencia", str(r["fracciones"])),
                               ("Valor de la residencia", "USD $" + format(r["value"], ",")),
                               ("Fracción 1/8", "USD $" + format(r["frac"], ",")),
                               ("Cuota anual de operación", "USD $" + format(r["opex"], ",")),
                               ("Entrega", r["entrega"])])
    extras = "".join('<li>%s</li>' % s for s in r["specs"])
    futuros = "".join(
        '<div class="panel"><span class="folio">%s</span><h3>%s</h3><p>%s</p></div>'
        % (estado, nombre, "Plaza: %s. En cuanto se libere, los copropietarios de Anthus "
           "tienen derecho de preferencia sobre las primeras fracciones." % plaza)
        for nombre, plaza, estado in FUTUROS)

    return pagehead("Anthus", r["pitch"],
                    [("inicio", "Inicio"), ("fractional", "Fractional")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="gallery" style="margin-bottom:40px">{gal}</div>
    <div class="proplayout">
      <div class="prose">
        <h2>El desarrollo</h2>
        <p style="margin-top:16px">{body}</p>
        <h3>Qué incluye</h3>
        <ul>{extras}</ul>
        <h3>Cómo se reparte el año</h3>
        <p>Su fracción le asigna 6.5 semanas anuales, de las cuales dos caen en alta temporada por reglamento. El orden de elección rota cada año y se invierte al siguiente, de modo que en ocho años cada copropietario ocupa cada posición del turno. El calendario del año siguiente se cierra en septiembre.</p>
        <p>Las semanas que usted no reclama entran al programa de rentas y el ingreso neto se le abona en el estado trimestral. No hay que contratarlo aparte: viene dentro del modelo.</p>
        <div class="note"><b>Plano y memoria de calidades.</b> Se entregan en la llamada de calificación junto con el avalúo y el certificado de libertad de gravamen.</div>
      </div>
      <aside class="propaside">
        <div class="specsheet">
          <div class="specsheet-h"><p class="folio">Ficha técnica</p></div>
          {specs}
        </div>
        <div class="specsheet">
          <div class="specsheet-h"><p class="folio">Fracciones liberadas</p></div>
          <div style="padding:16px 18px">{avail}</div>
        </div>
        <a class="btn" href="{memo}" style="justify-content:center">Memorándum de Anthus <span class="arw">&rarr;</span></a>
        <a class="btn btn-ghost" href="{num}" style="justify-content:center">Calcular el rendimiento</a>
        <p class="proof" style="margin-top:0">Sin llamada de por medio &middot; cifras auditadas</p>
      </aside>
    </div>
    <div style="margin-top:44px">{reassure}</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Lo que sigue</p></div>
      <div><h2>Anthus es el primero, <em>no el único.</em></h2>
      <p class="lede measure" style="margin-top:16px">Cada desarrollo se cierra en sus copropietarios y no se abre de nuevo. Los siguientes ya están en camino, y quien ya escrituró entra antes que el mercado.</p></div></div>
    <div class="grid2">{futuros}</div>
  </div>
</section>
<section>
  <div class="wrap sec">{captura}</div>
</section>
""".replace("{gal}", gal).replace("{body}", r["body"]).replace("{extras}", extras) \
   .replace("{specs}", specs) \
   .replace("{avail}", avail(r["vendidas"], TOTAL_FRACCIONES)) \
   .replace("{memo}", link("memorandum", single)) \
   .replace("{num}", link("numeros", single)) \
   .replace("{reassure}", reassure()) \
   .replace("{futuros}", futuros) \
   .replace("{captura}", mini_capture(
       "anthusMemo", "El memorándum de <em>Anthus</em>",
       "Estado de resultados del ejercicio anterior, ocupación real mes a mes, la cuota de "
       "operación desglosada y el calendario de fracciones con fecha de corte. Un correo con "
       "el documento adjunto.",
       "Enviármelo", fields="email"))


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
    <div class="note" style="margin-top:28px"><b>Estas cifras son ilustrativas.</b> No son una garantía de rendimiento y la plusvalía puede ser negativa. El memorándum de cada residencia trae las cifras auditadas del ejercicio anterior, y se lo damos sin condiciones.</div>
    <div style="margin-top:34px">{reassure}</div>
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
""".replace("{reassure}", reassure()) % bloque_calculadora()


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
    objeciones = [
        ("&ldquo;Todavía no tengo el capital listo.&rdquo;",
         "Entonces la llamada es justo ahora, no después. La mitad de la conversación es sobre estructura de pago y plazos: hay residencias en preventa con enganche del 40% y diferido a 24 meses. Saber qué necesita reunir es distinto de reunirlo."),
        ("&ldquo;No quiero que me persigan por teléfono.&rdquo;",
         "No hacemos seguimiento automático ni le inscribimos a nada. Si tras la llamada nos dice que no, se acabó. Y si prefiere no hablar con nadie todavía, descargue el memorándum y léalo con calma."),
        ("&ldquo;Quiero verlo con mi contador primero.&rdquo;",
         "Bien pensado, y para eso está el memorándum: trae el estado de resultados, el desglose de cuotas y el contrato de fideicomiso modelo. Pídalo, mándeselo, y hablamos cuando él le haya dicho lo que piense."),
        ("&ldquo;¿Y si no me gusta cuando la vea?&rdquo;",
         "Entonces no compra. La visita es antes del apartado, y el apartado es reembolsable durante todo el due diligence. No hay un solo punto del proceso donde quede atrapado."),
    ]
    obj = "".join(
        '<div class="panel"><span class="folio">Objeción 0%d</span><h3 style="font-size:1.05rem">%s</h3><p>%s</p></div>'
        % (i + 1, q, a) for i, (q, a) in enumerate(objeciones))

    return """<section class="close-sec" id="agendar" style="border-top:none">
  <div class="wrap sec close-grid">
    <div>
      <p class="eyebrow">Peldaño 03 &middot; La llamada</p>
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
      <div style="margin-top:30px">%s</div>
    </div>
    %s
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">El camino completo</p></div>
      <div><h2>Cinco peldaños, <em>y usted decide dónde parar.</em></h2>
      <p class="lede measure" style="margin-top:16px">Ninguno obliga al siguiente. Mucha gente se queda en el primero durante meses y vuelve cuando le toca.</p></div></div>
    %s
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Lo que frena</p></div>
      <div><h2>Las cuatro razones por las que <em>no</em> agenda.</h2>
      <p class="lede measure" style="margin-top:16px">Las hemos oído todas. Aquí están contestadas, para que no tenga que decirlas en voz alta.</p></div></div>
    <div class="grid2">%s</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Si aún no</p></div>
      <div><h2>¿No quiere hablar con nadie <em>todavía?</em></h2></div></div>
    %s
  </div>
</section>
""" % (reassure(), leadform("agendar"), ladder(3, single), obj,
       mini_capture("agendaMemo", "Empiece por <em>el papel.</em>",
                    "El memorándum contesta la mayoría de lo que preguntaría en la llamada, y lo puede leer a su ritmo, "
                    "enseñárselo a su contador y volver cuando quiera. Nadie le llama por descargarlo.",
                    "Enviarme el memorándum", fields="email"))


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


def exit_invite(single):
    return """<div class="exit" role="dialog" aria-modal="true" aria-label="Descargar el memorándum">
  <div class="exit-card">
    <p class="eyebrow">Antes de irse</p>
    <h3 style="margin-top:12px">Llévese <em>los números reales.</em></h3>
    <p>El memorándum de cualquiera de las tres residencias: cifras auditadas del ejercicio anterior, cuota de operación desglosada, reglamento de uso y contrato de fideicomiso modelo. Un correo, un adjunto, nada más.</p>
    <form class="mini" data-mini data-done="Enviado" id="exitForm">
      <input type="email" name="email" placeholder="Correo electrónico" required aria-label="Correo electrónico">
      <button class="btn" type="submit">Enviarme el memorándum <span class="arw">&rarr;</span></button>
      <p class="form-ok">Listo. Le llega en unos minutos.</p>
    </form>
    <button class="no" type="button">No, gracias &mdash; sigo mirando</button>
  </div>
</div>
"""


def p_memorandum(single):
    opciones = "".join('<option>%s &mdash; %s</option>' % (r["name"], r["loc"].replace("&middot;", "·"))
                       for r in RESIDENCIAS)
    return pagehead("El memorándum", "Es el documento que usaría su contador, no un folleto. Cifras auditadas del ejercicio anterior, la cuota de operación partida renglón por renglón, el reglamento de uso completo y el contrato de fideicomiso modelo.", [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="capture">
      <div>
        <h3>Qué trae <em>adentro</em></h3>
        <p style="margin-bottom:14px">Treinta y dos páginas, sin adjetivos:</p>
        <ul style="margin:0; padding-left:20px; color:var(--text-dim); font-size:.93rem; line-height:1.9">
          <li>Estado de resultados de la residencia, ejercicio anterior completo</li>
          <li>Ocupación real mes a mes y tarifa media obtenida por temporada</li>
          <li>Cuota de operación desglosada: predial, seguro, personal, alberca, reserva</li>
          <li>Avalúo bancario y certificado de libertad de gravamen</li>
          <li>Reglamento de uso y mecánica de rotación del calendario</li>
          <li>Contrato de fideicomiso modelo y costo de constitución</li>
          <li>Fracciones colocadas y disponibles, con fecha de corte</li>
        </ul>
      </div>
      <form class="mini" data-mini data-done="Enviado" id="memoForm">
        <select name="residencia" required aria-label="Residencia"><option value="">¿De qué residencia?</option>%s<option>Las tres</option></select>
        <input type="email" name="email" placeholder="Correo electrónico" required aria-label="Correo electrónico">
        <input type="tel" name="telefono" placeholder="WhatsApp (opcional)" aria-label="WhatsApp">
        <button class="btn" type="submit">Enviarme el memorándum <span class="arw">&rarr;</span></button>
        <p class="fine">Un solo correo con el documento adjunto. Ni listas, ni seguimiento automático, ni terceros. Si después quiere hablar con alguien, lo pide usted.</p>
        <p class="form-ok">Listo. Le llega en unos minutos; si no aparece, revise la carpeta de promociones.</p>
      </form>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Sin compromiso</p></div>
      <div><h2>Por qué lo damos <em>sin pedir nada a cambio.</em></h2>
      <p class="lede measure" style="margin-top:16px">Porque el documento descalifica a más gente de la que convence, y eso nos ahorra tiempo a los dos. Quien lo lee y sigue interesado, ya sabe dónde se está metiendo.</p></div></div>
    %s
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">El camino</p></div>
      <div><h2>Dónde está usted <em>ahora.</em></h2></div></div>
    %s
  </div>
</section>
""" % (opciones, reassure(), ladder(1, single))


def divbar(current, single):
    items = [("f", "fractional", "Fraccional", "Copropiedad escriturada"),
             ("t", "travel", "Travel", "Yates, circuitos y agencia"),
             ("i", "investing", "Investing", "Propiedad completa"),
             ("c", "club", "Club", "Sólo para inversionistas")]
    return '<div class="divbar">%s</div>' % "".join(
        '<a class="%s" href="%s"%s><span class="w">%s</span><span class="d">%s</span></a>'
        % (k, link(s, single), ' aria-current="page"' if s == current else '', w, d)
        for k, s, w, d in items)


def divbar_section(current, single):
    root = {"fractional": "fractional", "travel": "travel", "investing": "investing"}
    here = root.get(current, "")
    return """<section>
  <div class="wrap sec" style="padding-block:clamp(44px,5vw,72px)">
    <div class="sec-head" style="margin-bottom:26px">
      <div class="rail"><p class="folio">Las tres divisiones</p></div>
      <div><h2 style="font-size:clamp(1.5rem,2.6vw,2rem)">Lo demás que hacemos</h2></div>
    </div>
    %s
  </div>
</section>
""" % divbar(here, single)


def p_inicio(single):
    return """<section class="hero sec" id="top">
  <div class="wrap">
    <p class="eyebrow">Riviera Nayarit, México</p>
    <div class="namemap" style="margin-top:18px">
      <span class="w1">Fractional</span><span class="w2">Travel</span>
      <span class="amp">&amp;</span><span class="w3">Investing</span>
    </div>
    <p class="tagline" style="margin-top:14px">Own a piece of the places you love.</p>
    <p class="lede measure" style="margin-top:24px">El nombre no es una frase: son tres negocios. Puede <strong>viajar</strong> con nosotros sin comprometerse a nada, quedarse con <strong>una fracción</strong> de una casa frente al mar, o <strong>comprar completo</strong> una propiedad o un terreno. Los tres caminos los atiende la misma operación, y los tres llevan al mismo lugar.</p>
    <div class="hero-cta" style="margin-top:26px">
      <a class="btn" href="{book}">Hablar con alguien <span class="arw">&rarr;</span></a>
      <a class="btn btn-ghost" href="{memo}">Descargar el memorándum</a>
    </div>
    <div class="trustbar">
      <div><b>3</b> vías de entrada</div>
      <div><b>{libres}</b> fracciones disponibles</div>
      <div><b>3</b> yates propios</div>
      <div><b>7</b> propiedades en venta</div>
    </div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Nuestros productos</p></div>
      <div><h2>Elija por dónde <em>entra.</em></h2>
      <p class="lede measure" style="margin-top:16px">No hay una puerta mejor que otra: hay una que corresponde a lo que usted quiere hoy. Si no está seguro, entre por la que más se le parezca y en la llamada lo acomodamos.</p></div>
    </div>
    <div class="doors">
      <a class="door div-travel" href="{trav}">
        <span class="what">Menor compromiso</span>
        <span class="word">Travel</span>
        <p>Yates propios, actividades, circuitos y agencia de viajes. La forma de conocer la zona antes de comprometer nada &mdash; y lo que gaste se le acredita si después invierte.</p>
        <ul><li>Tres embarcaciones propias</li><li>Circuitos y viajes a la medida</li><li>Genera crédito hacia la inversión</li></ul>
        <span class="go">Ver la división <span>&rarr;</span></span>
      </a>
      <a class="door div-fractional" href="{frac}">
        <span class="what">Inversión compartida</span>
        <span class="word">Fraccional</span>
        <p>Una octava parte de una residencia en Anthus, escriturada a su nombre. Seis semanas y media de uso al año; lo que no usa, lo rentamos por usted.</p>
        <ul><li>Desde USD ${fracp}</li><li>Escritura pública e indiviso</li><li>Programa de rentas integrado</li></ul>
        <span class="go">Ver la división <span>&rarr;</span></span>
      </a>
      <a class="door div-investing" href="{inv}">
        <span class="what">Propiedad completa</span>
        <span class="word">Investing</span>
        <p>Condominios, casas, villas y terrenos en propiedad total. Sin copropietarios y sin reglamento de uso, con el programa de rentas como opción.</p>
        <ul><li>Desde USD $495,000</li><li>Expediente completo antes de firmar</li><li>Rentas opcional, contrato anual</li></ul>
        <span class="go">Ver la división <span>&rarr;</span></span>
      </a>
    </div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Cómo encajan</p></div>
      <div><h2>Tres negocios <em>que se alimentan.</em></h2>
      <p class="lede measure" style="margin-top:16px">No es un conglomerado: es un ciclo. Cada vertical existe porque resuelve lo que la anterior dejaba abierto.</p></div>
    </div>
    <div class="grid3 chain">
      <div class="panel"><span class="folio">01 &middot; Capta</span><h3>Travel abre la puerta</h3><p>Un día de yate o un circuito cuesta poco y no compromete a nada. Quien viene a pasarla bien conoce la zona, conoce a la operación, y se lleva un crédito acumulado hacia una inversión que todavía no ha decidido hacer.</p></div>
      <div class="panel"><span class="folio">02 &middot; Convierte</span><h3>Fraccional e Investing cierran</h3><p>Aquí ocurre la inversión de verdad, con escritura y notario. El programa de rentas es el argumento que la sostiene: la propiedad no se queda vacía los meses que usted no está, y el ingreso compensa la cuota.</p></div>
      <div class="panel"><span class="folio">03 &middot; Fideliza</span><h3>Club cierra el ciclo</h3><p>Al escriturar se abre la membresía: hoteles y resorts del mundo a la mitad. No es un producto que se persiga por separado &mdash; es la razón por la que invertir aquí vale más que invertir en otro lado.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Cuarta llave</p></div>
      <div><h2>Y lo que <em>no</em> se vende.</h2></div>
    </div>
    <div class="gate div-club">
      <span class="seal" aria-hidden="true"></span>
      <div>
        <h3>Club: sólo para <em>quien ya invirtió.</em></h3>
        <p>Una membresía de pago que da acceso a la plataforma Vacation Owners &mdash; hoteles y resorts de todo el mundo a la mitad del costo público, más los servicios de viaje de la casa. No tiene campaña, no tiene precio de lista público y no se abre a quien llega de fuera: se activa al escriturar en Fraccional o en Investing.</p>
        <p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="{club}">Ver qué incluye <span class="arw">&rarr;</span></a></p>
      </div>
    </div>
  </div>
</section>

{servicios}

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Programas</p></div>
      <div><h2>Dos cosas que <em>no se venden solas.</em></h2>
      <p class="lede measure" style="margin-top:16px">Ninguna de las dos es un producto de catálogo: son la manera en que operamos con quien ya está dentro.</p></div>
    </div>
    <div class="grid2">
      <a class="panel" href="{rentas}" style="text-decoration:none; color:inherit; display:block">
        <span class="folio">Programa</span><h3>Rentas</h3>
        <p>Si el dueño no usa su unidad &mdash; sea una fracción o una propiedad completa &mdash; nosotros la administramos y la rentamos por él. Integrado en Fraccional, opcional en Investing.</p>
        <p class="proof" style="margin-top:14px">Contrato anual &middot; sin exclusividad perpetua</p>
      </a>
      <a class="panel" href="{partner}" style="text-decoration:none; color:inherit; display:block">
        <span class="folio">Programa</span><h3>Partner Agent</h3>
        <p>Red de agentes y brokers aliados. No es producto al público: es el canal por el que trabajamos con quien ya tiene cartera y quiere colocar Fraccional, Investing o Travel.</p>
        <p class="proof" style="margin-top:14px">Protección de prospectos &middot; comisión a la firma</p>
      </a>
    </div>
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Lo común</p></div>
      <div><h2>Lo que no cambia <em>entre las tres.</em></h2></div>
    </div>
    {reassure}
  </div>
</section>

<section>
  <div class="wrap sec">
    <div class="sec-head">
      <div class="rail"><p class="folio">Voces</p></div>
      <div><h2>Quiénes ya <em>firmaron.</em></h2></div>
    </div>
    {testi}
  </div>
</section>

<section>
  <div class="wrap sec">{capture}</div>
</section>
""".replace("{book}", link("agendar", single)) \
   .replace("{memo}", link("memorandum", single)) \
   .replace("{libres}", str(TOTAL_LIBRES)) \
   .replace("{fracp}", format(ANTHUS["frac"], ",")) \
   .replace("{trav}", link("travel", single)) \
   .replace("{frac}", link("fractional", single)) \
   .replace("{inv}", link("investing", single)) \
   .replace("{club}", link("club", single)) \
   .replace("{rentas}", link("rentas", single)) \
   .replace("{partner}", link("partner-agent", single)) \
   .replace("{servicios}", bloque_servicios(single,
       "Concierge, chef, autos y catálogo de servicios no son una vertical aparte: son la "
       "capa que aparece dentro de las tres, operada por la misma gente.")) \
   .replace("{reassure}", reassure()) \
   .replace("{testi}", bloque_testimonios(3)) \
   .replace("{capture}", mini_capture(
       "hubMemo", "¿No sabe por cuál <em>de las tres?</em>",
       "Déjenos su correo y le mandamos el panorama completo en un solo documento: qué cuesta "
       "entrar en cada vertical, qué recibe, cómo funciona el crédito de Travel y qué abre el "
       "Club. Sin llamada de por medio.",
       "Enviarme el panorama", fields="email"))


# ---------------------------------------------------------------- travel

FLOTA = [
    dict(name="Azimut 55", cls="Yate a motor &middot; día completo", eslora="16.8 m",
         pax="12 pasajeros", cabinas="3 cabinas", trip="Capitán y marinero",
         rate=2400, salida="Marina Nuevo Vallarta",
         shot="Yate en navegación, banda de estribor"),
    dict(name="Sea Ray 38", cls="Deportivo &middot; medio día", eslora="11.6 m",
         pax="8 pasajeros", cabinas="1 cabina", trip="Capitán",
         rate=1150, salida="Marina Nuevo Vallarta",
         shot="Cubierta de proa con solárium"),
    dict(name="Catamarán Lagoon 46", cls="Catamarán &middot; día completo", eslora="14.0 m",
         pax="20 pasajeros", cabinas="4 cabinas", trip="Capitán, marinero y anfitrión",
         rate=3200, salida="Marina Riviera Nayarit",
         shot="Catamarán fondeado en Islas Marietas"),
]

EXPERIENCIAS = [
    ("Islas Marietas", "Navegación a la reserva de la biosfera, con permiso de acceso gestionado y guía certificado. El cupo diario está limitado por decreto, así que se reserva con semanas de anticipación."),
    ("Avistamiento de ballenas", "De diciembre a marzo, con biólogo a bordo y distancia de aproximación conforme a la NOM-131. Salidas de media jornada desde Nuevo Vallarta."),
    ("Pesca deportiva", "Salidas de altura por pez vela, dorado y marlín, con equipo Shimano y captura y liberación. De ocho a diez horas, según temporada."),
    ("Golf en la bahía", "Tee times en los campos de la zona, traslado incluido y caddie a solicitud. Se coordina con su calendario de estancia."),
    ("Chef y servicio en casa", "Menú a convenir, compra, servicio y limpieza. Para una cena o para toda la estancia."),
    ("Traslados y logística", "Recepción en el aeropuerto de Puerto Vallarta, vehículo con chofer y coordinación de llegadas escalonadas."),
]


def fleet_cards():
    return '<div class="fleet">%s</div>' % "".join("""<article class="vessel">
  %s
  <div class="vessel-b">
    <div><p class="cls">%s</p><h3>%s</h3></div>
    <dl><dt>Eslora</dt><dd>%s</dd><dt>Capacidad</dt><dd>%s</dd><dt>Cabinas</dt><dd>%s</dd><dt>Tripulación</dt><dd>%s</dd></dl>
    <p class="cls" style="margin-top:-4px">Salida: %s</p>
    <div class="rate"><span>USD por salida</span><b class="num">$%s</b></div>
  </div>
</article>""" % (holder("r32", v["shot"], "3:2 &middot; 2000×1333"), v["cls"], v["name"],
                 v["eslora"], v["pax"], v["cabinas"], v["trip"],
                 v["salida"], format(v["rate"], ",")) for v in FLOTA)


def p_travel(single):
    exp = "".join('<div class="panel"><h3>%s</h3><p>%s</p></div>' % (t, d)
                  for t, d in EXPERIENCIAS)
    return pagehead("Travel",
        "Agencia de experiencias: yates propios, actividades en la bahía, circuitos y viajes "
        "a la medida. Es la puerta de entrada de menor compromiso &mdash; y cada peso que "
        "gasta aquí se le acredita si después decide invertir.",
        [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="sec-head"><div class="rail"><p class="folio">Lo que la hace distinta</p></div>
      <div><h2>Su viaje <em>se convierte en enganche.</em></h2>
      <p class="lede measure" style="margin-top:16px">Cada experiencia que reserva con nosotros genera crédito acumulable hacia una futura inversión en Fraccional o Investing. Si nunca invierte, disfrutó el viaje y ya. Si invierte, el dinero que gastó conociendo la zona no se perdió.</p></div></div>
    <div class="credit">
      <div>
        <p class="step">Paso 01</p>
        <h4>Reserva una experiencia</h4>
        <p>Un día de yate, un circuito, una villa por temporada. Cualquier servicio de Travel cuenta, desde el primero.</p>
        <p class="amt num">[%]<small>del consumo se acredita</small></p>
      </div>
      <div>
        <p class="step">Paso 02</p>
        <h4>El crédito se acumula</h4>
        <p>Queda a su nombre, sin caducidad dentro del plazo del programa, y se suma con cada nueva reserva.</p>
        <p class="amt num">[n] meses<small>Vigencia del crédito</small></p>
      </div>
      <div>
        <p class="step">Paso 03</p>
        <h4>Se aplica a la inversión</h4>
        <p>Al escriturar una fracción en Anthus o una propiedad en Investing, el saldo se descuenta del enganche.</p>
        <p class="amt num">[tope]<small>Máximo aplicable</small></p>
      </div>
    </div>
    <div class="note" style="margin-top:26px"><b>Sustituya los corchetes por las condiciones reales del programa</b> &mdash; porcentaje acreditable, vigencia y tope máximo. Es la mecánica que más va a preguntar el cliente, y la que más rápido se cae si las cifras no cuadran con lo que firma.</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">La flota</p></div>
      <div><h2>Tres barcos, <em>y un capitán que conoce la bahía.</em></h2>
      <p class="lede measure" style="margin-top:16px">Embarcaciones propias, no intermediación. Eso fija la tarifa, el mantenimiento y quién responde si algo falla a veinte millas de la costa.</p></div></div>
    {flota}
    <div style="margin-top:28px"><a class="btn btn-ghost" href="{yates}">Ver la flota completa <span class="arw">&rarr;</span></a></div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Experiencias</p></div>
      <div><h2>Lo que se puede hacer <em>en la bahía.</em></h2></div></div>
    <div class="grid3">{exp}</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Agencia</p></div>
      <div><h2>Y lo que se puede hacer <em>fuera de ella.</em></h2>
      <p class="lede measure" style="margin-top:16px">Travel opera también como agencia de viajes: circuitos armados, vuelos, hoteles y salidas de varios días. Para los miembros del Club, con la tarifa de la plataforma Vacation Owners.</p></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Servicio 01</span><h3>Circuitos armados</h3><p>Rutas de varios días por la costa y la sierra, con transporte, hospedaje y guía resueltos. Salidas fijas o a la medida del grupo.</p></div>
      <div class="panel"><span class="folio">Servicio 02</span><h3>Vuelos y hospedaje</h3><p>Emisión de boletos y reservas de hotel dentro y fuera de México, con la coordinación de itinerario incluida.</p></div>
      <div class="panel"><span class="folio">Servicio 03</span><h3>Viajes a la medida</h3><p>Luna de miel, aniversario, grupo corporativo. Se cotiza sobre lo que quiere hacer, no sobre un paquete cerrado.</p></div>
    </div>
  </div>
</section>
{servicios}
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Para dueños</p></div>
      <div><h2>¿Tiene casa aquí <em>y está vacía?</em></h2>
      <p class="lede measure" style="margin-top:16px">El programa de rentas la opera por usted: la rentamos, la mantenemos y le reportamos. Usted decide qué fechas se queda.</p></div></div>
    <div><a class="btn" href="{rentas}">Ver el programa de rentas <span class="arw">&rarr;</span></a></div>
  </div>
</section>
<section>
  <div class="wrap sec">{captura}</div>
</section>
""".replace("{flota}", fleet_cards()) \
   .replace("{yates}", link("yates", single)) \
   .replace("{exp}", exp) \
   .replace("{servicios}", bloque_servicios(single,
       "Quien viaja con nosotros accede al mismo catálogo de servicios que un copropietario, "
       "durante toda su estancia.")) \
   .replace("{rentas}", link("rentas", single)) \
   .replace("{captura}", mini_capture(
       "travCot", "¿Fecha en mente? <em>Le cotizamos.</em>",
       "Díganos qué días, cuántas personas y qué le gustaría hacer. Le devolvemos "
       "disponibilidad real y una propuesta con precio cerrado, sin anticipo para cotizar. "
       "En la misma respuesta le decimos cuánto crédito genera esa reserva.",
       "Pedir disponibilidad", fields="email+tel", done="Solicitud enviada",
       fine="Le respondemos por WhatsApp o correo en el mismo día hábil. Cotizar no aparta la fecha; la fecha se aparta con el anticipo."))


def p_yates(single):
    return pagehead("Flota",
        "Tres embarcaciones propias con base en Nuevo Vallarta. Propias, no intermediadas: eso fija la tarifa, "
        "el mantenimiento y quién responde si algo falla a veinte millas de la costa.",
        [("inicio", "Inicio"), ("travel", "Travel")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    %s
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Qué incluye</p></div>
      <div><h2>Lo que entra <em>en la tarifa.</em></h2></div></div>
    <div class="grid2">
      <div class="panel"><span class="folio">Incluido</span><h3>Tripulación y combustible</h3><p>Capitán con licencia vigente, marinero y combustible para navegación dentro de la Bahía de Banderas. Hielo, agua embotellada, toallas y equipo de snorkel a bordo.</p></div>
      <div class="panel"><span class="folio">Aparte</span><h3>Alimentos, bebidas y permisos</h3><p>Catering y bebidas se cotizan según menú. El permiso de acceso a Islas Marietas se paga por persona y tiene cupo diario limitado por decreto, así que se gestiona con anticipación.</p></div>
      <div class="panel"><span class="folio">Reserva</span><h3>Anticipo del 50%%</h3><p>La fecha se aparta con la mitad; el resto el día de la salida. Cancelación sin costo hasta 72 horas antes. Si el capitán cancela por mar, se reprograma o se reembolsa completo.</p></div>
      <div class="panel"><span class="folio">Seguridad</span><h3>Póliza y equipo vigente</h3><p>Seguro de pasajeros, chalecos para todos los tripulantes incluidos menores, balsa y radio VHF. El capitán decide si se sale: si el parte marítimo no acompaña, no se navega.</p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">%s</div>
</section>
""" % (fleet_cards(),
       mini_capture("yateCot", "Díganos <em>la fecha.</em>",
                    "Cuántas personas, qué día y qué le gustaría hacer. Le devolvemos disponibilidad real de las "
                    "tres embarcaciones y una propuesta con precio cerrado.",
                    "Pedir disponibilidad", fields="email+tel", done="Solicitud enviada",
                    fine="Respondemos el mismo día hábil. Cotizar no aparta la fecha; la fecha se aparta con el anticipo."))


# ---------------------------------------------------------------- investing

CASAS = [
    dict(slug="condominio-marea", name="Condominio Marea 402", where="Nuevo Vallarta &middot; frente de playa",
         price=495000, m2="145 m&sup2;", terreno="Torre con amenidades", rec="2 recámaras",
         extra="Entrega inmediata", yield_="Renta estimada 7.4% anual",
         desc="El ticket de entrada más bajo del inventario. Cuarto piso con vista franca al mar, en una torre con alberca, gimnasio y acceso directo a playa. Se vende amueblado y listo para rentar."),
    dict(slug="casa-altamar", name="Casa Altamar", where="Punta de Mita &middot; frente de golf",
         price=1450000, m2="380 m&sup2;", terreno="620 m&sup2; de terreno", rec="4 recámaras",
         extra="Entrega inmediata", yield_="Renta estimada 6.2% anual",
         desc="Obra terminada en un desarrollo con acceso controlado y campo de golf. Se vende amueblada y con historial de renta de los últimos dos ejercicios."),
    dict(slug="casa-tamarindo", name="Casa Tamarindo", where="La Cruz de Huanacaxtle &middot; a tres calles del mar",
         price=780000, m2="240 m&sup2;", terreno="410 m&sup2; de terreno", rec="3 recámaras",
         extra="Escritura lista", yield_="Renta estimada 7.1% anual",
         desc="La opción de mejor rendimiento del inventario: precio de entrada moderado y una zona con ocupación pareja todo el año por la marina y el mercado del domingo."),
    dict(slug="villa-monteverde", name="Villa Monteverde", where="Sayulita &middot; ladera con vista",
         price=1120000, m2="295 m&sup2;", terreno="500 m&sup2; de terreno", rec="4 recámaras",
         extra="Entrega en 6 meses", yield_="Renta estimada 6.8% anual",
         desc="En construcción, con avance del 70%. Admite cambios de acabados si se aparta ahora, y el precio se congela a la firma."),
]

TERRENOS = [
    dict(slug="lote-punta-negra", name="Lote Punta Negra", where="Punta de Mita &middot; segunda línea",
         price=420000, sup="800 m&sup2;", uso="Uso habitacional, hasta 3 niveles",
         extra="Servicios a pie de lote", desc="Esquina con dos frentes y vista al mar desde el segundo nivel. Servidumbre de paso a playa por el condominio vecino, ya escriturada."),
    dict(slug="lote-higuera", name="Lotes La Higuera", where="San Pancho &middot; interior",
         price=165000, sup="500 m&sup2;", uso="Uso habitacional, hasta 2 niveles",
         extra="Seis lotes disponibles", desc="Fraccionamiento nuevo con calles y servicios terminados. Precio por lote; hay descuento por la compra de dos o más contiguos."),
    dict(slug="macrolote-bahia", name="Macrolote Bahía", where="Litibú &middot; frente de golf",
         price=1900000, sup="4,200 m&sup2;", uso="Uso mixto, densidad media",
         extra="Apto para desarrollo", desc="Superficie apta para un proyecto de doce a dieciséis unidades. Se entrega con estudio de factibilidad, levantamiento topográfico y anteproyecto."),
]


def listing_rows(items, kind, single):
    out = []
    for it in items:
        if kind == "casa":
            specs = "".join("<span>%s</span>" % s for s in [it["m2"], it["terreno"], it["rec"], it["extra"]])
            per = it["yield_"]
        else:
            specs = "".join("<span>%s</span>" % s for s in [it["sup"], it["uso"], it["extra"]])
            per = "USD $%s por m&sup2;" % format(round(it["price"] / int(it["sup"].replace(",", "").split()[0])), ",")
        out.append("""<a class="lot" href="%s">
  %s
  <div>
    <p class="where">%s</p>
    <h3>%s</h3>
    <p>%s</p>
    <div class="tags">%s</div>
  </div>
  <div class="money"><span>Precio</span><b class="num">$%s</b><span class="per">%s</span></div>
</a>""" % (link("agendar", single),
           holder("r43", "Fachada &mdash; " + it["name"], "4:3 &middot; 1600×1200"),
           it["where"], it["name"], it["desc"], specs,
           format(it["price"], ","), per))
    return '<div class="listing">%s</div>' % "".join(out)


def p_investing(single):
    return pagehead("Investing",
        "Propiedad completa: condominios, casas, villas y terrenos en Riviera Nayarit. Sin "
        "fracciones, sin copropietarios y sin reglamento de uso. Usted escritura el cien por "
        "ciento y decide qué hacer con el inmueble.",
        [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="sec-head"><div class="rail"><p class="folio">Construido</p></div>
      <div><h2>Condominios, casas <em>y villas.</em></h2>
      <p class="lede measure" style="margin-top:16px">Desde un departamento de dos recámaras listo para rentar hasta una villa en ladera. Todos con expediente completo antes de firmar.</p></div></div>
    {casas}
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Terrenos</p></div>
      <div><h2>Y tres superficies <em>para construir.</em></h2>
      <p class="lede measure" style="margin-top:16px">Desde un lote unifamiliar hasta un macrolote apto para desarrollo. Todos con escritura limpia y servicios verificados.</p></div></div>
    {lotes}
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Si no vive ahí</p></div>
      <div><h2>La rentamos por usted, <em>si usted quiere.</em></h2>
      <p class="lede measure" style="margin-top:16px">A diferencia de Fraccional, aquí el programa de rentas es opcional: usted decide si entra, marca las fechas que se queda y nosotros operamos el resto del año. Contrato anual, sin exclusividad perpetua.</p></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Opcional</span><h3>Entra si quiere</h3><p>Puede vivir ahí todo el año, usarla sólo en temporada o no rentarla nunca. Nadie le obliga a meterla al programa.</p></div>
      <div class="panel"><span class="folio">Anual</span><h3>Y sale cuando quiera</h3><p>Contrato de un año, renovable sólo si le conviene. Salida al término con 60 días de aviso, sin penalización.</p></div>
      <div class="panel"><span class="folio">Suyo</span><h3>Cobra lo que la suya generó</h3><p>No hay fondo común entre propiedades. Su estado trimestral refleja sus noches y sus tarifas.</p></div>
    </div>
    <div style="margin-top:26px"><a class="btn btn-ghost" href="{rentas}">Ver el programa de rentas <span class="arw">&rarr;</span></a></div>
  </div>
</section>
{servicios}
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Por qué aquí</p></div>
      <div><h2>La tesis de <em>Riviera Nayarit.</em></h2></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Argumento 01</span><h3>Aeropuerto y conectividad</h3><p>Puerto Vallarta recibe vuelo directo desde más de treinta ciudades de Norteamérica. Eso sostiene la demanda de renta y acorta el mercado de reventa: el comprador puede venir a verla el fin de semana.</p></div>
      <div class="panel"><span class="folio">Argumento 02</span><h3>Suelo limitado</h3><p>El corredor entre Nuevo Vallarta y Punta de Mita está acotado por la sierra y por la reserva. No hay superficie nueva de frente de playa; lo que se construye ahora es sobre lo poco que queda.</p></div>
      <div class="panel"><span class="folio">Argumento 03</span><h3>Doble demanda</h3><p>La misma propiedad sirve al comprador de segunda residencia y al operador de renta vacacional. Dos mercados sobre el mismo inventario sostienen mejor el precio en un ciclo malo.</p></div>
    </div>
    <div class="note" style="margin-top:28px"><b>Ningún argumento es una garantía.</b> El valor de un inmueble puede bajar, y una zona bien conectada también se corrige. Estos son los motivos por los que nosotros compramos aquí, no una promesa de rendimiento.</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Al escriturar</p></div>
      <div><h2>Comprar aquí <em>abre la puerta del Club.</em></h2></div></div>
    <div class="gate div-club">
      <span class="seal" aria-hidden="true"></span>
      <div>
        <h3>Sin importar <em>el monto.</em></h3>
        <p>Escriturar cualquier propiedad de Investing &mdash; un terreno de entrada o una villa &mdash; lo habilita para la membresía del Club: la plataforma Vacation Owners, con hoteles y resorts de todo el mundo a la mitad del costo público. No se vende a quien no ha invertido.</p>
        <p style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="{club}">Ver qué incluye el Club <span class="arw">&rarr;</span></a></p>
      </div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Lo mismo aplica</p></div>
      <div><h2>La estructura legal <em>no cambia.</em></h2>
      <p class="lede measure" style="margin-top:16px">Comprar entero o comprar una fracción se escritura igual: notario público, Registro Público de la Propiedad y, si usted es extranjero, fideicomiso bancario en zona restringida.</p></div></div>
    <div><a class="btn btn-ghost" href="{legal}">Ver la estructura legal <span class="arw">&rarr;</span></a></div>
  </div>
</section>
<section>
  <div class="wrap sec">{captura}</div>
</section>
""".replace("{casas}", listing_rows(CASAS, "casa", single)) \
   .replace("{lotes}", listing_rows(TERRENOS, "lote", single)) \
   .replace("{rentas}", link("rentas", single)) \
   .replace("{servicios}", bloque_servicios(single,
       "Comprar completo no significa operar solo: la misma capa de servicios está "
       "disponible cuando usted usa la propiedad, contratable por estancia.")) \
   .replace("{club}", link("club", single)) \
   .replace("{legal}", link("legal", single)) \
   .replace("{captura}", mini_capture(
       "invFicha", "La ficha completa <em>de la que le interese.</em>",
       "Plano, escritura, certificado de libertad de gravamen, avalúo y, en las propiedades "
       "terminadas, el historial de renta de los dos ejercicios anteriores. Un correo con el "
       "expediente adjunto.",
       "Pedir la ficha", fields="email+tel", done="Solicitud enviada",
       fine="Le llega el expediente de la propiedad que indique. Si prefiere verla en persona, coordinamos el recorrido sin compromiso."))


# ---------------------------------------------------------------- servicios
# Capa transversal: no es vertical propia, se inserta dentro de las tres.
SERVICIOS = [
    ("Concierge VIP", "Una persona asignada que resuelve la estancia completa: reservas, "
     "restaurantes, permisos, urgencias y lo que se ofrezca a media noche."),
    ("Chef en casa", "Menú a convenir, compra, servicio y limpieza. Para una cena o para "
     "toda la estancia, con el mercado del día."),
    ("Renta de autos", "Vehículo entregado en la propiedad o en el aeropuerto, con seguro "
     "y sin fila de mostrador."),
    ("Catálogo de servicios", "Limpieza extra, niñera, masaje, fotógrafo, decoración de "
     "aniversario. Se pide desde la plataforma y se cobra al final."),
]


def bloque_servicios(single, intro=None):
    """La capa de servicios, idéntica en las tres verticales."""
    tarjetas = "".join(
        '<div><span class="n">Servicio 0%d</span><h4>%s</h4><p>%s</p></div>' % (i + 1, t, d)
        for i, (t, d) in enumerate(SERVICIOS))
    return """<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Servicios</p></div>
      <div><h2>Lo que resuelve <em>la operación.</em></h2>
      <p class="lede measure" style="margin-top:16px">%s</p></div></div>
    <div class="svc">%s</div>
    <div style="margin-top:26px"><a class="btn btn-ghost" href="%s">Ver el catálogo completo <span class="arw">&rarr;</span></a></div>
  </div>
</section>
""" % (intro or "La misma capa de servicios está disponible en las tres verticales. No se "
       "vende por separado: viene con la propiedad, con la fracción o con la experiencia.",
       tarjetas, link("servicios", single))


def p_servicios(single):
    tarjetas = "".join(
        '<div class="panel"><span class="folio">Servicio 0%d</span><h3>%s</h3><p>%s</p></div>'
        % (i + 1, t, d) for i, (t, d) in enumerate(SERVICIOS))
    return pagehead("Servicios",
        "No es una vertical: es la capa que hace que tener una propiedad aquí no se sienta "
        "como un segundo empleo. Aparece dentro de Fraccional, Travel e Investing, y la "
        "opera la misma gente.",
        [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="grid2">%s</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Cómo se pide</p></div>
      <div><h2>Desde la plataforma, <em>no por WhatsApp a las tres de la mañana.</em></h2>
      <p class="lede measure" style="margin-top:16px">Todo lo que aparece arriba se solicita desde la plataforma de copropietarios y huéspedes, con precio a la vista antes de confirmar. Lo que se consume se cobra al cierre de la estancia, en un solo estado.</p></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Para copropietarios</span><h3>Incluido en la cuota</h3><p>El concierge y la coordinación de llegada no se cobran aparte: ya están dentro de la cuota anual de operación de su fracción.</p></div>
      <div class="panel"><span class="folio">Para dueños completos</span><h3>Contratable por estancia</h3><p>Si compró la propiedad entera, contrata la capa de servicios cuando la use, sin cuota fija todo el año.</p></div>
      <div class="panel"><span class="folio">Para huéspedes de Travel</span><h3>Dentro de la reserva</h3><p>Quien renta una experiencia o una villa por temporada accede al mismo catálogo durante su estancia.</p></div>
    </div>
  </div>
</section>
""" % tarjetas


# ---------------------------------------------------------------- club

def p_club(single):
    return pagehead("Club",
        "Una membresía que no se vende a cualquiera. Da acceso a la plataforma Vacation "
        "Owners: hoteles y resorts de todo el mundo a la mitad del costo público, más los "
        "servicios de viaje de la casa.",
        [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="gate">
      <span class="seal" aria-hidden="true"></span>
      <div>
        <h3>Sólo para quien ya <em>invirtió con nosotros.</em></h3>
        <p>Club no tiene campaña, no tiene precio de lista público y no se abre a quien llega de fuera. Se activa cuando usted escritura una fracción en Fraccional o una propiedad completa en Investing. Es un beneficio de haber invertido, no un producto que se persiga por separado.</p>
      </div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Qué da</p></div>
      <div><h2>La plataforma <em>Vacation Owners.</em></h2>
      <p class="lede measure" style="margin-top:16px">La red que los grandes desarrollos vacacionales usan para colocar inventario que de otro modo saldría vacío. Como miembro entra a esa misma red.</p></div></div>
    <div class="grid3">
      <div class="panel"><span class="folio">Beneficio 01</span><h3>Hoteles y resorts al 50%</h3><p>Inventario mundial de hoteles y resorts a la mitad del costo público. No son puntos ni semanas: es tarifa preferente sobre disponibilidad real, reservable en línea.</p></div>
      <div class="panel"><span class="folio">Beneficio 02</span><h3>Servicios de viaje incluidos</h3><p>Vuelos, traslados y coordinación de itinerario a través de la agencia de Travel, sin la comisión que pagaría por fuera.</p></div>
      <div class="panel"><span class="folio">Beneficio 03</span><h3>La capa de servicios, en viaje</h3><p>El mismo concierge que le resuelve la estancia en Riviera Nayarit le arma el viaje cuando se va a otro lado.</p></div>
    </div>
    <div class="note" style="margin-top:28px"><b>Cuota de membresía: [importe] al año.</b> Sustituya por el precio real y por las condiciones de renovación. El descuento sobre tarifa pública depende del inventario disponible en cada fecha y destino; no es un porcentaje garantizado sobre todo el catálogo.</div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Cómo se llega</p></div>
      <div><h2>Dos puertas, <em>y las dos pasan por invertir.</em></h2></div></div>
    <div class="grid2">
      <div class="panel"><span class="folio">Vía 01</span><h3>Desde Fraccional</h3><p>Al escriturar su fracción en Anthus queda elegible. La membresía se activa el mismo día de la firma, sin trámite aparte.</p><p style="margin-top:14px"><a class="btn btn-ghost btn-sm" href="{frac}">Ver Fraccional <span class="arw">&rarr;</span></a></p></div>
      <div class="panel"><span class="folio">Vía 02</span><h3>Desde Investing</h3><p>Al escriturar una casa, villa, condominio o terreno queda elegible en las mismas condiciones, sin importar el monto.</p><p style="margin-top:14px"><a class="btn btn-ghost btn-sm" href="{inv}">Ver Investing <span class="arw">&rarr;</span></a></p></div>
    </div>
  </div>
</section>
""".replace("{frac}", link("fractional", single)).replace("{inv}", link("investing", single))


# ---------------------------------------------------------------- programas

def p_rentas(single):
    return pagehead("Rentas",
        "Si no usa su propiedad, la rentamos por usted. Aplica igual a una fracción de "
        "Anthus que a una casa completa: usted marca las fechas que se queda y nosotros "
        "operamos el resto del año.",
        [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="pool">
      <div><p class="n">Tiempo 01</p><h3>Usted reserva sus fechas</h3><p>Antes de que empiece el año marca lo que se queda. Esas fechas quedan bloqueadas y nadie las toca. No hay mínimo de noches que ceder.</p><p class="fig num">0<small>Noches obligatorias</small></p></div>
      <div><p class="n">Tiempo 02</p><h3>Nosotros operamos el resto</h3><p>Publicación en canales, tarifa dinámica por temporada, recepción de huéspedes, limpieza entre estancias, mantenimiento preventivo y depósito de daños.</p><p class="fig num">22%<small>Comisión sobre lo rentado</small></p></div>
      <div><p class="n">Tiempo 03</p><h3>Le reportamos y le pagamos</h3><p>Estado trimestral con noches, tarifas obtenidas, gastos y neto. Transferencia el día 10 del mes siguiente al cierre, con CFDI.</p><p class="fig num">10<small>Día de pago, cada trimestre</small></p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Según qué compró</p></div>
      <div><h2>La misma operación, <em>dos puntos de partida.</em></h2></div></div>
    <div class="grid2">
      <div class="panel"><span class="folio">Si tiene una fracción</span><h3>Va integrado, no se contrata</h3><p>En Fraccional el programa de rentas ya viene dentro del modelo: las semanas de su fracción que no reclama pasan automáticamente a renta administrada, y el neto le llega en el estado trimestral. No firma nada aparte.</p></div>
      <div class="panel"><span class="folio">Si compró completo</span><h3>Es opcional, y se puede dejar</h3><p>En Investing usted decide si entra. El contrato es anual, se renueva sólo si quiere, y puede salir al término con 60 días de aviso, sin penalización ni recompra de nada.</p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Condiciones</p></div>
      <div><h2>Lo que hace distinto <em>a este programa.</em></h2></div></div>
    <div class="grid2">
      <div class="panel"><span class="folio">Condición 01</span><h3>Sin exclusividad perpetua</h3><p>El contrato es anual. No hay cláusula que lo amarre por diez años ni penalización por no renovar.</p></div>
      <div class="panel"><span class="folio">Condición 02</span><h3>Sin cuota de entrada</h3><p>No se cobra alta, ni fotografía, ni «puesta a punto». Si la propiedad necesita obra para rentarse, se lo decimos con presupuesto y usted decide.</p></div>
      <div class="panel"><span class="folio">Condición 03</span><h3>Su propiedad no entra a un fondo común</h3><p>Se renta la suya y usted cobra lo que la suya generó. No repartimos ingresos entre propiedades: quien tiene mejor unidad cobra más, y quien la tiene peor lo ve en su estado.</p></div>
      <div class="panel"><span class="folio">Condición 04</span><h3>Cuentas separadas</h3><p>Los depósitos de huéspedes y los ingresos no se mezclan con la operación de la administradora. Un concurso mercantil nuestro no alcanza su dinero.</p></div>
    </div>
    <div class="note" style="margin-top:28px"><b>Qué propiedades aceptamos.</b> Zona de [plazas donde opera]; mínimo [n] recámaras; alberca propia o del condominio; y disposición a mantener un estándar de mobiliario. No aceptamos todas: si su propiedad no va a rentarse bien, se lo decimos antes de firmar.</div>
  </div>
</section>
<section>
  <div class="wrap sec">{captura}</div>
</section>
""".replace("{captura}", mini_capture(
    "rentasAlta", "Cuéntenos <em>de su propiedad.</em>",
    "Ubicación, recámaras y si tiene alberca. Le devolvemos una estimación de ingreso anual "
    "basada en lo que rentan propiedades comparables que ya operamos, con el desglose de "
    "temporada alta y baja.",
    "Pedir la estimación", fields="email+tel", done="Solicitud enviada",
    fine="La estimación es gratuita y no compromete a nada. Si su propiedad no encaja, se lo decimos en esa misma respuesta."))


def p_partner(single):
    return pagehead("Partner Agent",
        "Red de agentes y brokers aliados. No es un producto al público: es el canal por el "
        "que trabajamos con quien ya tiene cartera de compradores y quiere colocar Fraccional, "
        "Investing o Travel sin dejar de ser independiente.",
        [("inicio", "Inicio")], single) + """
<section>
  <div class="wrap sec" style="padding-top:0">
    <div class="grid3">
      <div class="panel"><span class="folio">Cómo funciona 01</span><h3>Usted trae al cliente</h3><p>Registra al prospecto y queda protegido por [n] días. Si cierra en ese periodo, la comisión es suya aunque el cliente haya vuelto por su cuenta.</p></div>
      <div class="panel"><span class="folio">Cómo funciona 02</span><h3>Nosotros cerramos la operación</h3><p>Due diligence, notario, fideicomiso y escrituración los lleva nuestro equipo. Usted acompaña al cliente sin tener que volverse experto en copropiedad.</p></div>
      <div class="panel"><span class="folio">Cómo funciona 03</span><h3>Se le paga a la firma</h3><p>Comisión de [porcentaje] sobre el valor de la operación, liquidada dentro de los [n] días siguientes a la escritura, con factura.</p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">
    <div class="sec-head"><div class="rail"><p class="folio">Qué recibe</p></div>
      <div><h2>Material para vender, <em>no un folleto.</em></h2></div></div>
    <div class="grid2">
      <div class="panel"><span class="folio">Herramienta 01</span><h3>Memorándum y expedientes</h3><p>Las mismas cifras auditadas, avalúos y contratos modelo que recibe un inversionista. Sin versión recortada para agentes.</p></div>
      <div class="panel"><span class="folio">Herramienta 02</span><h3>Calculadora del modelo</h3><p>Puede correr el escenario del cliente delante de él, con los supuestos a la vista, y mandárselo por escrito.</p></div>
      <div class="panel"><span class="folio">Herramienta 03</span><h3>Recorridos coordinados</h3><p>Agendamos la visita al desarrollo y la salida en yate el mismo día si conviene. Usted acompaña, nosotros operamos.</p></div>
      <div class="panel"><span class="folio">Herramienta 04</span><h3>Registro de prospectos</h3><p>Alta en línea con folio y fecha, para que la protección de cartera no dependa de un correo perdido.</p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap sec">{captura}</div>
</section>
""".replace("{captura}", mini_capture(
    "partnerAlta", "¿Tiene cartera <em>y quiere colocarla?</em>",
    "Déjenos su correo y le mandamos las condiciones de la red: esquema de comisiones, "
    "protección de prospectos y el material de venta completo. Si ya trabaja una plaza "
    "de Riviera Nayarit, dígalo en el mensaje.",
    "Ver las condiciones", fields="email+tel", done="Solicitud enviada",
    fine="Le respondemos en el mismo día hábil. No publicamos su nombre ni lo listamos en el sitio sin su permiso."))


# ---------------------------------------------------------------- registro

PAGES = [
    ("inicio", "Fractional, Travel &amp; Investing",
     "Tres vías de entrada en Riviera Nayarit: viajes que generan crédito, copropiedad fraccional escriturada y propiedad completa. Más el Club, sólo para inversionistas.",
     p_inicio, ""),

    # --- Fraccional -------------------------------------------------------
    ("fractional", "Fraccional",
     "Copropiedad fraccional escriturada en Anthus. Una octava parte de la residencia, seis semanas y media al año, y programa de rentas integrado.",
     p_fractional, "div-fractional"),
    ("anthus", "Anthus",
     "El desarrollo con el que abrimos la vertical de copropiedad. Cada residencia dividida en ocho fracciones escrituradas.",
     p_anthus, "div-fractional"),
    ("modelo", "Cómo funciona",
     "Ocho copropietarios, una escritura por fracción, un calendario que rota y una administradora que opera la casa.",
     p_modelo, "div-fractional"),
    ("numeros", "Los números",
     "Calculadora del modelo económico de una fracción, con los supuestos de ocupación, comisión y cuota declarados.",
     p_inversion, "div-fractional"),
    ("memorandum", "El memorándum",
     "Cifras auditadas, reglamento de uso y contrato de fideicomiso modelo de Anthus, sin costo ni compromiso.",
     p_memorandum, "div-fractional"),
    ("copropietarios", "Copropietarios",
     "Testimonios de copropietarios y qué esperar del primer año tras escriturar una fracción.",
     p_copropietarios, "div-fractional"),

    # --- Travel -----------------------------------------------------------
    ("travel", "Travel",
     "Yates propios, actividades, circuitos y agencia de viajes. Cada experiencia genera crédito hacia una futura inversión.",
     p_travel, "div-travel"),
    ("yates", "Flota",
     "Tres embarcaciones propias con base en Nuevo Vallarta: yate a motor, deportivo y catamarán, con tripulación.",
     p_yates, "div-travel"),

    # --- Investing --------------------------------------------------------
    ("investing", "Investing",
     "Condominios, casas, villas y terrenos en propiedad completa en Riviera Nayarit, con expediente completo antes de firmar.",
     p_investing, "div-investing"),

    # --- Club -------------------------------------------------------------
    ("club", "Club",
     "Membresía exclusiva para quienes ya invirtieron: plataforma Vacation Owners con hoteles y resorts al 50% del costo público.",
     p_club, "div-club"),

    # --- Capa y programas transversales -----------------------------------
    ("servicios", "Servicios",
     "Concierge VIP, chef, renta de autos y catálogo de servicios. La capa que aparece dentro de las tres verticales.",
     p_servicios, ""),
    ("rentas", "Rentas",
     "Si no usa su propiedad, la rentamos por usted. Integrado en Fraccional, opcional en Investing.",
     p_rentas, ""),
    ("partner-agent", "Partner Agent",
     "Red de agentes y brokers aliados: protección de prospectos, material de venta y comisión a la firma.",
     p_partner, ""),

    # --- Casa -------------------------------------------------------------
    ("legal", "Estructura legal",
     "Escritura pública, fideicomiso bancario, reglamento de uso y administración con cuentas separadas.",
     p_legal, ""),
    ("nosotros", "Quiénes somos",
     "El equipo que selecciona los inmuebles, opera las casas y coordina notarios y fideicomisos.",
     p_nosotros, ""),
    ("diario", "Diario",
     "Notas de operación sobre copropiedad fraccional, fideicomisos y el mercado de Riviera Nayarit.",
     p_diario, ""),
    ("preguntas", "Preguntas frecuentes",
     "Diez preguntas sobre copropiedad fraccional: salida, morosidad, calendario, fideicomiso y fiscalidad.",
     p_preguntas, ""),
    ("agendar", "Hablar con alguien",
     "Una conversación de cuarenta y cinco minutos para saber cuál de las vías le corresponde, si es que alguna.",
     p_agendar, ""),
    ("avisos", "Aviso legal y privacidad",
     "Naturaleza de la información publicada, tratamiento de datos personales y documentos que rigen la operación.",
     p_avisos, ""),
]


def asset_version(path):
    """Hash del contenido, para versionar la URL del asset y romper la caché."""
    with open(os.path.join(HERE, path), "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def build():
    os.makedirs(os.path.join(HERE, "dist"), exist_ok=True)
    cssv = asset_version("assets/styles.css")
    jsv = asset_version("assets/site.js")
    routes = []

    for slug, title, desc, fn, division in PAGES:
        # --- página estática del hub ---
        body = fn(False)
        if division:
            body += divbar_section(slug, False)
        body += ribbon(slug, False)
        if slug not in ("agendar", "avisos"):
            body += stickybar(False) + exit_invite(False)
        body = '<div class="page %s">%s</div>' % (division, body)
        html = (HEAD.format(title=title, desc=desc, root="", cssv=cssv, jsv=jsv)
                + topbar(slug, False) + body + footer(False)
                + TAIL.format(root="", jsv=jsv))
        name = "index.html" if slug == "inicio" else slug + ".html"
        with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
            f.write(html)

        # --- misma página como ruta del previsualizador ---
        rbody = fn(True)
        if division:
            rbody += divbar_section(slug, True)
        rbody += ribbon(slug, True)
        routes.append('<div class="route page %s" data-route="/%s">%s</div>'
                      % (division, slug, rbody))

    css = open(os.path.join(HERE, "assets/styles.css"), encoding="utf-8").read()
    js = open(os.path.join(HERE, "assets/site.js"), encoding="utf-8").read()
    preview = (
        '<title>Fractional Travel &amp; Investing</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
        'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400'
        '&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">\n'
        '<style>\n' + css + '\n</style>\n'
        + topbar("inicio", True)
        + stickybar(True) + exit_invite(True)
        + "\n".join(routes)
        + footer(True)
        + '<script>\n' + js + '\n</script>\n')
    with open(os.path.join(HERE, "dist/preview.html"), "w", encoding="utf-8") as f:
        f.write(preview)

    print("%d páginas + dist/preview.html (%d KB)" % (len(PAGES), len(preview) // 1024))



# ---------------------------------------------------------------- embudo

TOTAL_FRACCIONES = ANTHUS["liberadas"] * ANTHUS["fracciones"]
TOTAL_LIBRES = TOTAL_FRACCIONES - ANTHUS["vendidas"]


def stickybar(single, texto=None, cta="Agendar llamada"):
    return """<div class="stickybar">
  <div class="wrap stickybar-in">
    <div class="txt">
      <p class="t1">%s</p>
      <p class="t2"><b>%d</b> de %d fracciones disponibles &middot; sin compromiso</p>
    </div>
    <a class="btn ghost btn-sm" href="%s">Descargar el memorándum</a>
    <a class="btn btn-sm" href="%s">%s <span class="arw">&rarr;</span></a>
    <button class="x" type="button" aria-label="Cerrar">&times;</button>
  </div>
</div>
""" % (texto or "¿Le cuadran los números? El siguiente paso es una llamada de 45 minutos.",
       TOTAL_LIBRES, TOTAL_FRACCIONES, link("memorandum", single), link("agendar", single), cta)


def ladder(here, single):
    pasos = [
        ("Peldaño 01", "El memorándum", "Cifras auditadas del ejercicio anterior, reglamento de uso y contrato de fideicomiso modelo, de la residencia que le interese.", "Su correo", "memorandum"),
        ("Peldaño 02", "Su escenario por escrito", "Tomamos los números que usted movió en la calculadora y le devolvemos el cálculo con las cifras reales de esa residencia.", "Correo y WhatsApp", "inversion"),
        ("Peldaño 03", "La llamada de calificación", "Cuarenta y cinco minutos con quien opera las casas. Si el modelo no le conviene, se lo decimos ahí mismo.", "45 minutos", "agendar"),
        ("Peldaño 04", "La visita", "Recorrido de las residencias disponibles, presencial o guiado por video. Sin apartado de por medio.", "Media jornada", "agendar"),
        ("Peldaño 05", "Apartado y escritura", "Carta de intención, apartado reembolsable, due diligence y firma ante notario.", "8 a 12 semanas", "agendar"),
    ]
    return '<div class="ladder">%s</div>' % "".join(
        '<a class="rung%s" href="%s" style="text-decoration:none; color:inherit">'
        '<span class="n">%s</span><h4>%s</h4><p>%s</p><p class="cost">%s</p></a>'
        % (" here" if i + 1 == here else "", link(dest, single), n, t, d, c)
        for i, (n, t, d, c, dest) in enumerate(pasos))


REASSURE = [
    ("Nada cuesta hasta la escritura", "La llamada, el memorándum, la visita y el expediente completo no tienen costo ni le comprometen a nada."),
    ("El apartado es reembolsable", "Durante todo el periodo de due diligence puede retirarse y se le devuelve íntegro. Está en la carta de intención."),
    ("Ve el expediente antes de firmar", "Avalúo, libertad de gravamen, reglamento y fideicomiso llegan a sus manos antes de que firme nada."),
    ("Puede salir cuando quiera", "La fracción se vende como cualquier inmueble. No hay penalización ni plazo forzoso."),
]


def reassure():
    return '<div class="reassure">%s</div>' % "".join(
        '<div><p class="h">%s</p><p>%s</p></div>' % (h, p) for h, p in REASSURE)


def mini_capture(ident, title, text, button, fields="email", done="Enviado", fine=None):
    campos = ('<input type="email" name="email" placeholder="Correo electrónico" required aria-label="Correo electrónico">')
    if fields == "email+tel":
        campos += '<input type="tel" name="telefono" placeholder="WhatsApp (opcional)" aria-label="WhatsApp">'
    return """<div class="capture">
  <div>
    <h3>%s</h3>
    <p>%s</p>
  </div>
  <form class="mini" data-mini data-done="%s" id="%s">
    %s
    <button class="btn" type="submit">%s <span class="arw">&rarr;</span></button>
    <p class="fine">%s</p>
    <p class="form-ok">Listo. Le llega en unos minutos; si no aparece, revise la carpeta de promociones.</p>
  </form>
</div>""" % (title, text, done, ident, campos, button,
             fine or "Un solo correo con el documento adjunto. Ni listas, ni seguimiento automático, ni terceros.")


def notfor():
    items = [
        ("Si necesita liquidez inmediata", "Vender una fracción toma semanas, no horas. Si podría necesitar ese capital de un día para otro, este no es el lugar."),
        ("Si su horizonte es menor a cinco años", "Los costos de entrada y salida se amortizan con el tiempo. Por debajo de cinco años, la aritmética rara vez sale."),
        ("Si quiere usar la casa más de ocho semanas", "Con ese uso conviene comprar entera. Se lo diríamos en la llamada, y le ahorramos la llamada diciéndoselo aquí."),
        ("Si espera rendimiento garantizado", "Nadie puede garantizarlo y quien se lo prometa le está mintiendo. Aquí la renta es una estimación y la plusvalía puede ser negativa."),
    ]
    return '<div class="notfor">%s</div>' % "".join(
        '<div><span class="x">&times;</span><div><h4>%s</h4><p>%s</p></div></div>' % (h, p)
        for h, p in items)


if __name__ == "__main__":
    build()
