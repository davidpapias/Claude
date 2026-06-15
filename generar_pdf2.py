from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus.flowables import Flowable
import datetime

W, H = A4
AZUL   = colors.HexColor('#2c70ba')
ROJO   = colors.HexColor('#b41f1f')
NARANJA= colors.HexColor('#c87000')
VERDE  = colors.HexColor('#1a7a1a')
GRIS   = colors.HexColor('#f0f0f0')
GRIS2  = colors.HexColor('#d0d0d0')
NEGRO  = colors.black
BLANCO = colors.white

doc = SimpleDocTemplate(
    '/home/user/Claude/reporte_meta_pixel.pdf',
    pagesize=A4,
    rightMargin=1.8*cm, leftMargin=1.8*cm,
    topMargin=2.2*cm, bottomMargin=2*cm,
    title='Reporte Meta Pixel',
)

base = getSampleStyleSheet()

def sty(name, parent='Normal', **kw):
    s = ParagraphStyle(name, parent=base[parent], **kw)
    return s

S_titulo    = sty('Titulo',    fontSize=16, textColor=AZUL,   spaceAfter=4,  spaceBefore=6,  fontName='Helvetica-Bold')
S_subtitulo = sty('Sub',       fontSize=10, textColor=AZUL,   spaceAfter=2,  spaceBefore=8,  fontName='Helvetica-Bold')
S_body      = sty('Body',      fontSize=9,  textColor=NEGRO,  spaceAfter=4,  leading=14)
S_code      = sty('Code',      fontSize=7.5,textColor=NEGRO,  spaceAfter=4,  fontName='Courier', backColor=GRIS, leading=11, leftIndent=6, rightIndent=6, borderPadding=4)
S_header_sec= sty('HdrSec',   fontSize=10, textColor=BLANCO, spaceAfter=0,  spaceBefore=10, fontName='Helvetica-Bold')
S_nota      = sty('Nota',      fontSize=8.5,textColor=colors.HexColor('#5a4000'), backColor=colors.HexColor('#fff8dc'), leading=13, leftIndent=4)
S_center    = sty('Center',    fontSize=9,  alignment=TA_CENTER)
S_badge_r   = sty('BadgeR',    fontSize=8,  textColor=BLANCO, backColor=ROJO,    fontName='Helvetica-Bold', alignment=TA_CENTER)
S_badge_n   = sty('BadgeN',    fontSize=8,  textColor=BLANCO, backColor=NARANJA, fontName='Helvetica-Bold', alignment=TA_CENTER)
S_badge_m   = sty('BadgeM',    fontSize=8,  textColor=NEGRO,  backColor=colors.HexColor('#e6c800'), fontName='Helvetica-Bold', alignment=TA_CENTER)

def sec_header(text, color=ROJO):
    return Table(
        [[Paragraph(f'  {text}', S_header_sec)]],
        colWidths=[W - 3.6*cm],
        style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), color),
            ('TOPPADDING',  (0,0), (-1,-1), 5),
            ('BOTTOMPADDING',(0,0),(-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
        ])
    )

def code_table(code_text):
    return Table(
        [[Paragraph(code_text.replace('\n','<br/>').replace(' ','&nbsp;'), S_code)]],
        colWidths=[W - 3.6*cm],
        style=TableStyle([
            ('BACKGROUND',   (0,0),(-1,-1), GRIS),
            ('BOX',          (0,0),(-1,-1), 0.5, GRIS2),
            ('TOPPADDING',   (0,0),(-1,-1), 6),
            ('BOTTOMPADDING',(0,0),(-1,-1), 6),
            ('LEFTPADDING',  (0,0),(-1,-1), 6),
            ('RIGHTPADDING', (0,0),(-1,-1), 6),
        ])
    )

story = []

# ─── PORTADA ─────────────────────────────────────────────────────────────────
story.append(Spacer(1, 1.5*cm))
story.append(Table(
    [[Paragraph('REPORTE DE ERRORES Y SOLUCIONES', sty('P1',fontSize=18,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.6*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14)])
))
story.append(Spacer(1, 0.3*cm))
story.append(Table(
    [[Paragraph('Meta Pixel — eventosptovallartatransfer.com', sty('P2',fontSize=13,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.6*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e8f0fa')),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)])
))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph(
    'Se realizaron <b>3 pasadas de verificacion</b> sobre el codigo fuente real del sitio. '
    'Todos los errores fueron confirmados con numeros de linea exactos obtenidos directamente del HTML del servidor. '
    f'Fecha: {datetime.date.today().strftime("%d/%m/%Y")}',
    S_body
))
story.append(Spacer(1, 0.8*cm))

# ─── TABLA RESUMEN ───────────────────────────────────────────────────────────
story.append(Paragraph('RESUMEN EJECUTIVO', S_titulo))
story.append(HRFlowable(width='100%', thickness=1, color=AZUL))
story.append(Spacer(1, 0.2*cm))

hdr = [
    Paragraph('<b>#</b>', S_center),
    Paragraph('<b>Error</b>', sty('bld',fontName='Helvetica-Bold',fontSize=8.5)),
    Paragraph('<b>Prioridad</b>', sty('bld2',fontName='Helvetica-Bold',fontSize=8.5,alignment=TA_CENTER)),
    Paragraph('<b>Impacto principal</b>', sty('bld3',fontName='Helvetica-Bold',fontSize=8.5)),
]
rows_data = [
    ('1','Pixel fuera de </html> en 4 paginas',         'CRITICO','r', 'Pixel no detectado en Safari y moviles'),
    ('2','Race condition: beacon abortado al navegar',   'CRITICO','r', 'Purchase NUNCA llega a Facebook'),
    ('3','Purchase dispara en clicks fallidos',          'CRITICO','r', 'Datos basura, calidad de pixel degradada'),
    ('4','value hardcodeado a $300 siempre',             'ALTO',   'n', 'ROAS incorrecto, mala optimizacion'),
    ('5','Falta embudo ViewContent/InitiateCheckout',    'ALTO',   'n', 'Sin lookalike ni optimizacion real'),
    ('6','Purchase antes del pago real',                 'ALTO',   'n', 'Ventas falsas reportadas a Facebook'),
    ('7','id del sorteo hardcoded como "113"',           'MEDIO',  'm', 'Sin distincion por producto'),
    ('8','Sin eventID, deduplicacion imposible',         'MEDIO',  'm', 'Doble conteo si se agrega Conversions API'),
    ('9','jQuery duplicado en genera-tu-boleto',         'MEDIO',  'm', 'Inestabilidad en esa pagina'),
]
badge_map = {'r': S_badge_r, 'n': S_badge_n, 'm': S_badge_m}
bg_map    = {'r': colors.HexColor('#fde8e8'), 'n': colors.HexColor('#fff3dc'), 'm': colors.HexColor('#fffde0')}

table_rows = [hdr]
for i, r in enumerate(rows_data):
    col = r[3]  # 'r', 'n', or 'm'
    table_rows.append([
        Paragraph(r[0], S_center),
        Paragraph(r[1], sty(f'tda{i}', fontSize=8.5)),
        Paragraph(r[2], badge_map[col]),
        Paragraph(r[4], sty(f'tdb{i}', fontSize=8.5)),
    ])

t = Table(table_rows, colWidths=[1*cm, 7*cm, 2.5*cm, 7.3*cm])
ts = TableStyle([
    ('BACKGROUND', (0,0), (-1,0), AZUL),
    ('TEXTCOLOR',  (0,0), (-1,0), BLANCO),
    ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',   (0,0), (-1,0), 9),
    ('GRID',       (0,0), (-1,-1), 0.4, GRIS2),
    ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING',(0,0),(-1,-1), 4),
    ('LEFTPADDING',(0,0),(-1,-1), 5),
])
for i, r in enumerate(rows_data):
    bg = {'r': colors.HexColor('#fde8e8'), 'n': colors.HexColor('#fff3dc'), 'm': colors.HexColor('#fffde0')}[r[3]]
    ts.add('BACKGROUND', (0, i+1), (-1, i+1), bg)
t.setStyle(ts)
story.append(t)
story.append(Spacer(1, 0.5*cm))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 1
# ═══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(KeepTogether([
    sec_header('ERROR #1 — CRITICO  |  Pixel fuera del </html> en las 4 paginas', ROJO),
    Spacer(1, 0.25*cm),
    Paragraph('<b>Problema:</b>', S_subtitulo),
    Paragraph(
        'El bloque fbq("init") esta colocado DESPUES de &lt;/html&gt; en <b>todas las paginas</b>. '
        'Verificado con numero de linea exacto en cada URL:',
        S_body
    ),
]))
story.append(code_table(
    '/                  ->  linea 682: </body>  683: </html>  684: <!-- Pixel -->\n'
    '/s-6218            ->  linea 2466: </body>  2467: </html>  2468: <!-- Pixel -->\n'
    '/pagos             ->  linea 715: </body>  716: </html>  717: <!-- Pixel -->\n'
    '/genera-tu-boleto  ->  linea 935: </body>  936: </html>  937: <!-- Pixel -->'
))
story.append(Paragraph(
    'HTML invalido. El comportamiento al procesar scripts fuera del documento es no estandar. '
    'Safari y algunos navegadores moviles los pueden ignorar o diferir. '
    'El Meta Pixel Helper falla en detectarlo correctamente.', S_body
))
story.append(Paragraph('<b>Solucion:</b>', S_subtitulo))
story.append(Paragraph('Eliminar el bloque del final y pegarlo dentro del &lt;head&gt;, antes de &lt;/head&gt;, en las 4 paginas:', S_body))
story.append(code_table(
    '<!-- PEGAR DENTRO DEL <head> antes de </head> EN LAS 4 PAGINAS -->\n'
    '<script>\n'
    '  !function(f,b,e,v,n,t,s)\n'
    '  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n'
    '  n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n'
    '  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\'2.0\';\n'
    '  n.queue=[];t=b.createElement(e);t.async=!0;\n'
    '  t.src=v;s=b.getElementsByTagName(e)[0];\n'
    '  s.parentNode.insertBefore(t,s)}(window,document,\'script\',\n'
    '  \'https://connect.facebook.net/en_US/fbevents.js\');\n'
    '  fbq(\'init\', \'1272564394151080\');\n'
    '  fbq(\'track\', \'PageView\');\n'
    '</script>\n'
    '<noscript><img height="1" width="1" style="display:none"\n'
    '  src="https://www.facebook.com/tr?id=1272564394151080&ev=PageView&noscript=1"\n'
    '/></noscript>'
))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 2
# ═══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 0.3*cm))
story.append(sec_header('ERROR #2 — CRITICO  |  Race condition: navegacion aborta el beacon', ROJO))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'fbq("track","Purchase") se llama y acto seguido ticket.js ejecuta '
    'document.getElementById("form-ticket").submit(). El navegador navega inmediatamente '
    'y cancela el beacon antes de que salga a los servidores de Meta. '
    'Confirmado: NO existe eventCallback en el codigo actual.', S_body
))
story.append(Paragraph('Orden real de carga en /s-6218 (verificado):', S_body))
story.append(code_table(
    'L1119  -> Listener Pixel registrado (inline script)\n'
    'L1566  -> ticket.js carga (define form.submit())\n'
    'L2289  -> app.js carga\n'
    'L2465  -> main.js carga\n'
    'L2477  -> fbevents.js empieza a descargarse (async, 379 KB)  <- ULTIMO\n'
    'L2478  -> fbq("init", "1272564394151080")                    <- DESPUES DE TODO\n\n'
    'Flujo al hacer click en COMPRAR:\n'
    '  1. submit -> [captura] Pixel -> fbq("track","Purchase") <- beacon en cola async\n'
    '  2. submit -> [burbuja] ticket.js -> form.submit()        <- NAVEGACION INMEDIATA\n'
    '  3. Navegacion cancela el beacon -> Purchase NUNCA llega a Facebook'
))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 3
# ═══════════════════════════════════════════════════════════════════════════════
story.append(sec_header('ERROR #3 — CRITICO  |  Purchase dispara en cada click aunque falle la validacion', ROJO))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'El listener usa fase de captura (tercer argumento: true). Se ejecuta ANTES que ticket.js valide los campos. '
    'Cada click en COMPRAR con campos vacios o invalidos genera un Purchase falso en Facebook Ads.', S_body
))
story.append(code_table(
    'form.addEventListener("submit", function () {\n'
    '    fbq("track", "Purchase", ...)  // <- dispara AQUI, sin importar validacion\n'
    '}, true);  // <- true = captura, antes que ticket.js'
))
story.append(Paragraph('<b>Solucion conjunta para Error #2 y #3</b> — Reemplazar el listener completo en /s-6218 (lineas 1119-1210):', S_subtitulo))
story.append(code_table(
    '<script>\n'
    '(function () {\n'
    '  function calcularValorCompra() {\n'
    '    var quantity = 0;\n'
    '    var unitPrice = parseFloat(\'300.00\') || 0;\n'
    '    try {\n'
    '      var sel = JSON.parse(sessionStorage.getItem(\'r1f4-numb3r\')) || [];\n'
    '      quantity = sel.length;\n'
    '      if (typeof obtenerPrecio === \'function\' && quantity > 0) {\n'
    '        var p = parseFloat(obtenerPrecio(quantity));\n'
    '        if (!isNaN(p)) unitPrice = p;\n'
    '      }\n'
    '    } catch (e) {}\n'
    '    return { value:+(unitPrice*quantity).toFixed(2), quantity:quantity, unit_price:unitPrice };\n'
    '  }\n\n'
    '  document.addEventListener(\'DOMContentLoaded\', function () {\n'
    '    var form = document.getElementById(\'form-ticket\');\n'
    '    if (!form) return;\n\n'
    '    form.addEventListener(\'submit\', function (e) {\n\n'
    '      // FIX #3: verificar validacion antes de disparar el Pixel\n'
    '      var name  = document.getElementById(\'name\');\n'
    '      var last  = document.getElementById(\'last-name\');\n'
    '      var phone = document.getElementById(\'phone\');\n'
    '      var state = document.getElementById(\'state\');\n'
    '      var isValid = name && name.value.trim() !== \'\' &&\n'
    '                    last && last.value.trim() !== \'\' &&\n'
    '                    phone && /^\\d{10}$/.test(phone.value) &&\n'
    '                    state && state.value !== \'\';\n'
    '      if (!isValid) return;   // no disparar si hay errores\n\n'
    '      if (typeof fbq !== \'function\') return;\n\n'
    '      // FIX #2: prevenir navegacion hasta que el beacon salga\n'
    '      e.preventDefault();\n'
    '      e.stopImmediatePropagation();\n\n'
    '      var data = calcularValorCompra();\n'
    '      var value = data.value > 0 ? data.value : parseFloat(\'300.00\');\n'
    '      var eventID = \'ck-\' + Date.now() + \'-\' + Math.random().toString(36).substr(2,9);\n'
    '      var sorteoID = form.action.split(\'/\').pop(); // FIX #7: id dinamico\n\n'
    '      var submitted = false;\n'
    '      function enviarFormulario() {\n'
    '        if (submitted) return; submitted = true;\n'
    '        document.getElementById(\'form-ticket\').submit();\n'
    '      }\n\n'
    '      // FIX #2: navegar DESPUES de que el beacon salga\n'
    '      fbq(\'track\', \'InitiateCheckout\', {\n'
    '        currency: \'MXN\', value: value,\n'
    '        num_items: data.quantity || 1,\n'
    '        contents: [{id:sorteoID, quantity:data.quantity||1, item_price:data.unit_price}],\n'
    '        content_type: \'product\'\n'
    '      }, { eventID: eventID, eventCallback: enviarFormulario });\n\n'
    '      setTimeout(enviarFormulario, 500); // respaldo si callback no dispara\n'
    '    }, true);\n'
    '  });\n'
    '})();\n'
    '</script>'
))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 4
# ═══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(sec_header('ERROR #4 — ALTO  |  value siempre hardcodeado a $300 MXN', NARANJA))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'Si obtenerPrecio() no esta disponible en el momento del calculo (orden de carga), '
    'el fallback es siempre $300. Si el cliente compra 5 boletos con promocion de $250 c/u, '
    'Facebook recibe value:300 en lugar de value:1250. El ROAS reportado en Facebook Ads es incorrecto.', S_body
))
story.append(code_table('var unitPrice = parseFloat(\'300.00\') || 0;  // fallback fijo, incorrecto'))
story.append(Paragraph('<b>Solucion:</b>', S_subtitulo))
story.append(Paragraph('El codigo del Error #2 ya resuelve esto al calcular dentro del submit handler (cuando obtenerPrecio ya existe). Agregar log para detectar el fallback:', S_body))
story.append(code_table(
    '// Dentro de calcularValorCompra():\n'
    'if (typeof obtenerPrecio !== \'function\') {\n'
    '  console.warn(\'[Pixel] obtenerPrecio no disponible, usando precio base $300\');\n'
    '}'
))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 5
# ═══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 0.3*cm))
story.append(sec_header('ERROR #5 — ALTO  |  Faltan eventos del embudo de conversion', NARANJA))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'Sin embudo completo, Facebook no puede optimizar campanas para compradores reales '
    'ni construir audiencias lookalike de calidad.', S_body
))
emb_data = [
    [Paragraph('<b>Evento</b>', sty('eh1',fontName='Helvetica-Bold',fontSize=8.5,textColor=BLANCO)),
     Paragraph('<b>Donde debe ir</b>', sty('eh2',fontName='Helvetica-Bold',fontSize=8.5,textColor=BLANCO)),
     Paragraph('<b>Estado</b>', sty('eh3',fontName='Helvetica-Bold',fontSize=8.5,textColor=BLANCO))],
    [Paragraph('ViewContent', sty('ec1',fontSize=8.5)), Paragraph('Al abrir /s-6218', sty('ec2',fontSize=8.5)), Paragraph('FALTA', sty('ec3',fontSize=8.5,textColor=ROJO,fontName='Helvetica-Bold'))],
    [Paragraph('InitiateCheckout', sty('ec4',fontSize=8.5)), Paragraph('Al abrir el formulario', sty('ec5',fontSize=8.5)), Paragraph('FALTA', sty('ec6',fontSize=8.5,textColor=ROJO,fontName='Helvetica-Bold'))],
    [Paragraph('AddPaymentInfo', sty('ec7',fontSize=8.5)), Paragraph('Al visitar /pagos', sty('ec8',fontSize=8.5)), Paragraph('FALTA', sty('ec9',fontSize=8.5,textColor=ROJO,fontName='Helvetica-Bold'))],
    [Paragraph('Purchase real', sty('ec10',fontSize=8.5)), Paragraph('Al confirmar pago', sty('ec11',fontSize=8.5)), Paragraph('NO EXISTE', sty('ec12',fontSize=8.5,textColor=ROJO,fontName='Helvetica-Bold'))],
]
te = Table(emb_data, colWidths=[4.5*cm, 6*cm, 3*cm])
te.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0),AZUL),
    ('GRID',(0,0),(-1,-1),0.4,GRIS2),
    ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
    ('LEFTPADDING',(0,0),(-1,-1),5),
    ('BACKGROUND',(0,1),(-1,-1),colors.HexColor('#fff0f0')),
]))
story.append(te)
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph('<b>Solucion A — ViewContent en /s-6218</b> (en el &lt;head&gt; despues del PageView):', S_subtitulo))
story.append(code_table(
    '<script>\n'
    '  fbq(\'track\', \'ViewContent\', {\n'
    '    content_name: \'Sorteo S-6218\',\n'
    '    content_ids: [\'113\'],\n'
    '    content_type: \'product\',\n'
    '    currency: \'MXN\',\n'
    '    value: 300.00\n'
    '  });\n'
    '</script>'
))
story.append(Paragraph('<b>Solucion B — AddPaymentInfo en /pagos</b> (en el &lt;head&gt; despues del PageView):', S_subtitulo))
story.append(code_table(
    '<script>\n'
    '  fbq(\'track\', \'AddPaymentInfo\', {\n'
    '    currency: \'MXN\',\n'
    '    value: 0\n'
    '  });\n'
    '</script>'
))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 6
# ═══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(sec_header('ERROR #6 — ALTO  |  Purchase antes del pago real', NARANJA))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'El pago es manual: transferencia / OXXO + comprobante por WhatsApp. '
    'El evento Purchase se dispara cuando el usuario envia el formulario, '
    'antes de haber pagado. Facebook cuenta ventas que nunca se completaron. El ROAS es ficticio.', S_body
))
story.append(Paragraph('<b>Solucion — Conversions API desde el servidor (PHP)</b> al confirmar el pago manualmente:', S_subtitulo))
story.append(code_table(
    '// Ejecutar en el servidor cuando confirmes el pago:\n'
    '$data = [\n'
    '  \'data\' => [[\n'
    '    \'event_name\'    => \'Purchase\',\n'
    '    \'event_time\'    => time(),\n'
    '    \'event_id\'      => \'purchase-\' . $boleto_id,  // mismo eventID del navegador\n'
    '    \'action_source\' => \'website\',\n'
    '    \'user_data\'     => [\n'
    '      \'ph\' => [hash(\'sha256\', $telefono_cliente)],\n'
    '    ],\n'
    '    \'custom_data\'   => [\n'
    '      \'currency\'   => \'MXN\',\n'
    '      \'value\'      => $precio_total,\n'
    '      \'num_items\'  => $cantidad_boletos,\n'
    '      \'contents\'   => [[\n'
    '        \'id\'         => (string)$sorteo_id,\n'
    '        \'quantity\'   => $cantidad_boletos,\n'
    '        \'item_price\' => $precio_unitario,\n'
    '      ]],\n'
    '    ],\n'
    '  ]],\n'
    '];\n'
    '$ch = curl_init();\n'
    'curl_setopt($ch, CURLOPT_URL,\n'
    '  \'https://graph.facebook.com/v19.0/1272564394151080/events?access_token=TU_TOKEN\');\n'
    'curl_setopt($ch, CURLOPT_POST, 1);\n'
    'curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\n'
    'curl_setopt($ch, CURLOPT_HTTPHEADER, [\'Content-Type: application/json\']);\n'
    'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n'
    'curl_exec($ch);'
))
story.append(Paragraph(
    '<b>Donde obtener el Token:</b> Meta Business Suite -> Configuracion del Pixel -> Conversions API -> Generar token de acceso.', S_body
))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 7
# ═══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 0.3*cm))
story.append(sec_header('ERROR #7 — MEDIO  |  id del sorteo hardcoded como "113"', colors.HexColor('#7a6000')))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'Todos los eventos de Purchase reportan contents:[{id:"113"}] sin importar el sorteo. '
    'Facebook no puede distinguir que sorteo genero la conversion.', S_body
))
story.append(Paragraph('<b>Solucion</b> (incluida en el codigo del Error #2):', S_subtitulo))
story.append(code_table("var sorteoID = form.action.split('/').pop(); // extrae '113' de /ticket/113 dinamicamente"))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 8
# ═══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 0.2*cm))
story.append(sec_header('ERROR #8 — MEDIO  |  Sin eventID, deduplicacion imposible', colors.HexColor('#7a6000')))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'fbq("track",...) se llama sin eventID. Si el usuario hace doble click se registran '
    'dos Purchase sin forma de deduplicar. Al agregar Conversions API, cada conversion se contaria doble.', S_body
))
story.append(Paragraph('<b>Solucion</b> (incluida en el codigo del Error #2):', S_subtitulo))
story.append(code_table(
    'var eventID = \'ck-\' + Date.now() + \'-\' + Math.random().toString(36).substr(2,9);\n'
    'fbq(\'track\', \'InitiateCheckout\', payload, { eventID: eventID, eventCallback: ... });\n'
    '// Usar el mismo eventID en la Conversions API del servidor para deduplicar.'
))

# ═══════════════════════════════════════════════════════════════════════════════
# ERROR 9
# ═══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 0.2*cm))
story.append(sec_header('ERROR #9 — MEDIO  |  jQuery duplicado en /genera-tu-boleto', colors.HexColor('#7a6000')))
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph('<b>Problema:</b>', S_subtitulo))
story.append(Paragraph(
    'Dos versiones de jQuery cargando al mismo tiempo (lineas L52 y L54). '
    'La segunda (2.1.3) sobrescribe $ y puede romper cualquier plugin que use features de jQuery 3.x.', S_body
))
story.append(code_table(
    'L52: <script src="/js/jquery-3.6.0.min.js"></script>           <- CONSERVAR\n'
    'L54: <script src=".../jquery/2.1.3/jquery.min.js"></script>    <- ELIMINAR'
))
story.append(Paragraph('<b>Solucion:</b>', S_subtitulo))
story.append(Paragraph('Eliminar la siguiente linea de /genera-tu-boleto:', S_body))
story.append(code_table('<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>'))

# ═══════════════════════════════════════════════════════════════════════════════
# PLAN
# ═══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(sec_header('PLAN DE IMPLEMENTACION RECOMENDADO', VERDE))
story.append(Spacer(1, 0.3*cm))

plan = [
    [Paragraph('<b>Cuando</b>',sty('ph1',fontName='Helvetica-Bold',fontSize=8.5,textColor=BLANCO)),
     Paragraph('<b>Paso</b>',  sty('ph2',fontName='Helvetica-Bold',fontSize=8.5,textColor=BLANCO)),
     Paragraph('<b>Accion</b>',sty('ph3',fontName='Helvetica-Bold',fontSize=8.5,textColor=BLANCO)),
     Paragraph('<b>Resuelve</b>',sty('ph4',fontName='Helvetica-Bold',fontSize=8.5,textColor=BLANCO))],
    [Paragraph('HOY',sty('pc1',fontSize=8.5,fontName='Helvetica-Bold',textColor=VERDE)),
     Paragraph('1',sty('pn1',fontSize=8.5,alignment=TA_CENTER)),
     Paragraph('Mover el Pixel al &lt;head&gt; en las 4 paginas',sty('pa1',fontSize=8.5)),
     Paragraph('Error #1',sty('pr1',fontSize=8.5))],
    [Paragraph('HOY',sty('pc2',fontSize=8.5,fontName='Helvetica-Bold',textColor=VERDE)),
     Paragraph('2',sty('pn2',fontSize=8.5,alignment=TA_CENTER)),
     Paragraph('Reemplazar el listener de submit en /s-6218',sty('pa2',fontSize=8.5)),
     Paragraph('Error #2, #3, #7, #8',sty('pr2',fontSize=8.5))],
    [Paragraph('HOY',sty('pc3',fontSize=8.5,fontName='Helvetica-Bold',textColor=VERDE)),
     Paragraph('3',sty('pn3',fontSize=8.5,alignment=TA_CENTER)),
     Paragraph('Agregar ViewContent en /s-6218',sty('pa3',fontSize=8.5)),
     Paragraph('Error #5A',sty('pr3',fontSize=8.5))],
    [Paragraph('HOY',sty('pc4',fontSize=8.5,fontName='Helvetica-Bold',textColor=VERDE)),
     Paragraph('4',sty('pn4',fontSize=8.5,alignment=TA_CENTER)),
     Paragraph('Agregar AddPaymentInfo en /pagos',sty('pa4',fontSize=8.5)),
     Paragraph('Error #5B',sty('pr4',fontSize=8.5))],
    [Paragraph('HOY',sty('pc5',fontSize=8.5,fontName='Helvetica-Bold',textColor=VERDE)),
     Paragraph('5',sty('pn5',fontSize=8.5,alignment=TA_CENTER)),
     Paragraph('Quitar jQuery duplicado en /genera-tu-boleto',sty('pa5',fontSize=8.5)),
     Paragraph('Error #9',sty('pr5',fontSize=8.5))],
    [Paragraph('PROX. SEMANA',sty('pc6',fontSize=8.5,fontName='Helvetica-Bold',textColor=NARANJA)),
     Paragraph('6',sty('pn6',fontSize=8.5,alignment=TA_CENTER)),
     Paragraph('Implementar Conversions API en el servidor (PHP)',sty('pa6',fontSize=8.5)),
     Paragraph('Error #6',sty('pr6',fontSize=8.5))],
]
tp = Table(plan, colWidths=[3*cm, 1.2*cm, 8.5*cm, 3.5*cm])
tp.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0),AZUL),
    ('GRID',(0,0),(-1,-1),0.4,GRIS2),
    ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
    ('LEFTPADDING',(0,0),(-1,-1),5),
    ('BACKGROUND',(0,1),(-1,5),colors.HexColor('#edf7ed')),
    ('BACKGROUND',(0,6),(-1,6),colors.HexColor('#fff8e8')),
    ('ALIGN',(1,0),(1,-1),'CENTER'),
]))
story.append(tp)
story.append(Spacer(1, 0.6*cm))

# NOTA FINAL
story.append(Table(
    [[Paragraph(
        '<b>NOTA IMPORTANTE:</b> Los errores #2 y #3 combinados son la causa principal '
        'por la que no se registran los eventos en Facebook. El evento se dispara en el momento '
        'incorrecto (antes de validar) y la navegacion inmediata cancela el beacon antes de que llegue '
        'a los servidores de Meta. Implementar el paso 2 del plan de hoy resuelve el problema principal.',
        S_nota
    )]],
    colWidths=[W - 3.6*cm],
    style=TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#fff8dc')),
        ('BOX',(0,0),(-1,-1),1,colors.HexColor('#c8a000')),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),
    ])
))

doc.build(story)
print('PDF generado correctamente.')
