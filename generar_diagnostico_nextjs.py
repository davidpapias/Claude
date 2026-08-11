from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import datetime

W, H = A4
AZUL    = colors.HexColor('#2c70ba')
AZULOSC = colors.HexColor('#1c4f85')
ROJO    = colors.HexColor('#b41f1f')
VERDE   = colors.HexColor('#1a7a1a')
AMBAR   = colors.HexColor('#a66c00')
GRIS    = colors.HexColor('#f0f0f0')
GRIS2   = colors.HexColor('#d0d0d0')
BLANCO  = colors.white
HOY = datetime.date.today().strftime('%d/%m/%Y')

base = getSampleStyleSheet()
def sty(name, parent='Normal', **kw):
    return ParagraphStyle(name, parent=base[parent], **kw)

S_body = sty('body', fontSize=9.5, leading=14, spaceAfter=5)
S_sub  = sty('sub',  fontSize=10, textColor=AZUL, fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=3)
S_code = sty('code', fontSize=7.6, fontName='Courier', leading=10.5)
S_cell = sty('cell', fontSize=8.7, leading=12)
S_cellB= sty('cellB', fontSize=8.7, leading=12, fontName='Helvetica-Bold')

def _pg(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawCentredString(W/2, 1*cm, f'Diagnóstico Pixel — Migración Next.js · eventosptovallartatransfer.com · {HOY} · Pág. {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate('/home/user/Claude/diagnostico_nextjs_pixel_dev.pdf', pagesize=A4,
                        rightMargin=1.6*cm, leftMargin=1.6*cm, topMargin=1.8*cm, bottomMargin=1.6*cm,
                        title='Diagnóstico - Pixel incompleto tras migración a Next.js')

def sec(text, color=AZULOSC):
    return Table([[Paragraph(f'  {text}', sty('sh',fontSize=11,textColor=BLANCO,fontName='Helvetica-Bold'))]],
        colWidths=[W-3.2*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('TOPPADDING',(0,0),(-1,-1),6),
                          ('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),6)]))

def box(text, bg, border, tc):
    return Table([[Paragraph(text, sty('bx',fontSize=9.3,textColor=tc,leading=13))]], colWidths=[W-3.2*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('BOX',(0,0),(-1,-1),0.8,border),
                          ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
                          ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)]))

def code(text):
    return Table([[Paragraph(text.replace('\n','<br/>').replace(' ','&nbsp;'), S_code)]],
        colWidths=[W-3.2*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),GRIS),('BOX',(0,0),(-1,-1),0.5,GRIS2),
                          ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
                          ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8)]))

def numbered(items, color):
    out = []
    for n, t in items:
        out.append(Table([[Paragraph(f'<b>{n}</b>',sty('nn',fontSize=9,textColor=BLANCO,alignment=TA_CENTER)),
                           Paragraph(t, sty('tt',fontSize=9,leading=13))]],
            colWidths=[0.9*cm, W-4.1*cm],
            style=TableStyle([('BACKGROUND',(0,0),(0,0),color),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                              ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                              ('LEFTPADDING',(1,0),(1,0),8)])))
        out.append(Spacer(1,0.12*cm))
    return out

s = []

# Título
s.append(Table([[Paragraph('DIAGNÓSTICO — Pixel incompleto tras migración a Next.js', sty('t',fontSize=15,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14)])))
s.append(Spacer(1,0.15*cm))
s.append(Table([[Paragraph('eventosptovallartatransfer.com · Meta Pixel 1272564394151080', sty('t2',fontSize=10,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e8f0fa')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)])))
s.append(Spacer(1,0.45*cm))

# Resumen ejecutivo
s.append(box(
    '<b>QUÉ PASÓ:</b> El sitio se migró de PHP/jQuery a Next.js en las últimas semanas. '
    'En esa migración se reescribió el código del pixel desde cero, pero <b>solo se '
    'reimplementaron 2 de los 6 eventos</b> que ya funcionaban correctamente antes '
    '(PageView y CompleteRegistration). Los otros 4 — ViewContent, InitiateCheckout, '
    'AddPaymentInfo y <b>Purchase</b> — nunca se volvieron a programar. No es un bug ni '
    'algo que se rompió: <b>simplemente no se volvió a escribir</b> tras el cambio de plataforma.',
    colors.HexColor('#fde8e8'), ROJO, colors.HexColor('#7a1414')))
s.append(Spacer(1,0.35*cm))

# Evidencia
s.append(sec('EVIDENCIA — código real encontrado en el sitio en producción', AZULOSC))
s.append(Spacer(1,0.15*cm))
s.append(Paragraph('Se extrajo y leyó el archivo compilado <font face="Courier">'
    '_next/static/chunks/app/layout-*.js</font> servido en vivo por el sitio. Contiene '
    'la única función de tracking que existe hoy:', S_body))
s.append(code(
    "function i(e){\n"
    "  let {pixelIds:t, value:n, numItems:r, first:i, last:o, phone:l, eventId:a} = e;\n"
    "  if (typeof window.fbq !== 'function' || !t.length) return;\n"
    "  let u = {fn:i.trim(), ln:o.trim(), ph:l.replace(/\\D/g,'')},\n"
    "      s = {value:Math.max(0,Math.round(100*n)/100), currency:'MXN', num_items:r},\n"
    "      c = a ? {eventID:a} : void 0;\n"
    "  for (let e of t)\n"
    "    window.fbq(\"init\", e, u),\n"
    "    window.fbq(\"trackSingle\", e, \"CompleteRegistration\", s, c);  // <- SOLO este evento\n"
    "}"))
s.append(Paragraph('Búsqueda de los otros 5 nombres de evento en ese mismo archivo:', S_sub))
s.append(code(
    "grep -oE '(Purchase|InitiateCheckout|AddPaymentInfo|ViewContent|CompleteRegistration)' layout.js\n"
    "→ CompleteRegistration   (1 coincidencia)\n"
    "→ Purchase               (0 coincidencias)\n"
    "→ InitiateCheckout       (0 coincidencias)\n"
    "→ AddPaymentInfo         (0 coincidencias)\n"
    "→ ViewContent            (0 coincidencias, salvo 1 suelta en otra página)"))
s.append(box(
    '<b>Nota positiva:</b> la arquitectura nueva es mejor que la anterior — ya soporta '
    'múltiples pixeles (<font face="Courier">pixelIds</font>) y ya envía Advanced Matching '
    '(<font face="Courier">fn, ln, ph</font>) en cada evento. Por eso el EMQ de '
    'CompleteRegistration subió de 6.1 a <b>7.8/10</b>. El patrón está bien hecho — solo '
    'falta aplicarlo a los 4 eventos que faltan, reusando esta misma función.',
    colors.HexColor('#edf7ed'), VERDE, colors.HexColor('#14521a')))
s.append(Spacer(1,0.3*cm))

# Tabla de lo que falta
s.append(sec('QUÉ FALTA Y DÓNDE DEBE IR CADA EVENTO', ROJO))
s.append(Spacer(1,0.15*cm))
rows = [
    ['ViewContent', 'Al cargar la página de un sorteo (/s-XXXX)', 'Media'],
    ['InitiateCheckout', 'Al abrir el modal/formulario de compra', 'Alta'],
    ['AddPaymentInfo', 'En la página /pagos', 'Media'],
    ['Purchase', 'Junto con CompleteRegistration, mismo instante, mismo eventID', 'CRÍTICA'],
]
header = [Paragraph('<b>Evento faltante</b>',S_cellB), Paragraph('<b>Dónde debe dispararse</b>',S_cellB), Paragraph('<b>Prioridad</b>',S_cellB)]
data = [header]
for r in rows:
    color = '#b41f1f' if r[2]=='CRÍTICA' else ('#a66c00' if r[2]=='Alta' else '#1a7a1a')
    data.append([Paragraph(f'<b>{r[0]}</b>',S_cell), Paragraph(r[1],S_cell), Paragraph(f'<font color="{color}"><b>{r[2]}</b></font>',S_cell)])
t = Table(data, colWidths=[4*cm, 9.5*cm, 3*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0),AZULOSC), ('TEXTCOLOR',(0,0),(-1,0),BLANCO),
    ('GRID',(0,0),(-1,-1),0.5,GRIS2), ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[BLANCO,GRIS]),
]))
s.append(t)
s.append(Spacer(1,0.3*cm))

s.append(Paragraph('Código sugerido — mismo patrón ya existente, solo cambiando el nombre del evento:', S_sub))
s.append(code(
    "// Reusar la función i() existente (renombrar a algo como trackPixelEvent),\n"
    "// parametrizando el nombre del evento en vez de tenerlo fijo:\n"
    "function trackPixelEvent(eventName, {pixelIds, value, numItems, first, last, phone, eventId}) {\n"
    "  if (typeof window.fbq !== 'function' || !pixelIds.length) return;\n"
    "  let u = {fn:first.trim(), ln:last.trim(), ph:phone.replace(/\\D/g,'')},\n"
    "      s = {value:Math.max(0,Math.round(100*value)/100), currency:'MXN', num_items:numItems},\n"
    "      c = eventId ? {eventID:eventId} : void 0;\n"
    "  for (let e of pixelIds)\n"
    "    window.fbq(\"init\", e, u),\n"
    "    window.fbq(\"trackSingle\", e, eventName, s, c);\n"
    "}\n"
    "\n"
    "// Ejemplo: al confirmar la compra, disparar los dos juntos con el MISMO eventId:\n"
    "trackPixelEvent('CompleteRegistration', {...datos, eventId});\n"
    "trackPixelEvent('Purchase', {...datos, eventId});  // <- agregar esta línea"))

s.append(Spacer(1,0.3*cm))
s.append(sec('CÓMO VERIFICAR QUE QUEDÓ BIEN', AZUL))
s.append(Spacer(1,0.15*cm))
s.append(Paragraph(
    'Abrir DevTools → pestaña <font face="Courier">Network</font> → filtro '
    '<font face="Courier">tr</font> → marcar <font face="Courier">Preserve log</font> → hacer '
    'una compra de prueba completa. Deben aparecer los 6 eventos: '
    '<font face="Courier">ev=PageView, ViewContent, InitiateCheckout, AddPaymentInfo, '
    'CompleteRegistration, Purchase</font>.', S_body))

doc.build(s, onFirstPage=_pg, onLaterPages=_pg)
print('PDF generado.')
