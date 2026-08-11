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

S_body = sty('body', fontSize=9.3, leading=13.5, spaceAfter=4)
S_h2   = sty('h2', fontSize=10.5, textColor=BLANCO, fontName='Helvetica-Bold')
S_cell = sty('cell', fontSize=8.7, leading=12)
S_cellB= sty('cellB', fontSize=8.7, leading=12, fontName='Helvetica-Bold')

def _pg(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawCentredString(W/2, 1*cm, f'Historial Meta Pixel · eventosptovallartatransfer.com · {HOY} · Pág. {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate('/home/user/Claude/historial_completo_pixel.pdf', pagesize=A4,
                        rightMargin=1.6*cm, leftMargin=1.6*cm, topMargin=1.8*cm, bottomMargin=1.6*cm,
                        title='Historial completo - Meta Pixel')

def sec(text, color=AZULOSC):
    return Table([[Paragraph(f'  {text}', S_h2)]], colWidths=[W-3.2*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('TOPPADDING',(0,0),(-1,-1),6),
                          ('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),6)]))

def box(text, bg, border, tc):
    return Table([[Paragraph(text, sty('bx',fontSize=9.3,textColor=tc,leading=13))]], colWidths=[W-3.2*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('BOX',(0,0),(-1,-1),0.8,border),
                          ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
                          ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)]))

s = []

# Título
s.append(Table([[Paragraph('HISTORIAL COMPLETO — Meta Pixel', sty('t',fontSize=16,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14)])))
s.append(Spacer(1,0.15*cm))
s.append(Table([[Paragraph('eventosptovallartatransfer.com · Pixel 1272564394151080 (PIXEL NUEVO)', sty('t2',fontSize=10,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e8f0fa')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)])))
s.append(Spacer(1,0.45*cm))

# Resumen ejecutivo
s.append(box(
    '<b>RESUMEN:</b> El evento Purchase funcionó con normalidad del 12 al 19 de junio de 2026. '
    'A partir del 20 de junio dejó de registrarse por completo (0 eventos) debido a un error de '
    'JavaScript que rompía la ejecución del código del pixel al enviar el formulario de compra. '
    'El 13 de julio de 2026 se diagnosticó la causa exacta en vivo, el desarrollador aplicó la '
    'corrección, y se confirmó por tres vías independientes (código, red del navegador y reporte '
    'de Facebook Ads) que el evento vuelve a registrarse correctamente.',
    colors.HexColor('#e6f0fa'), AZUL, colors.HexColor('#1c3d5c')))
s.append(Spacer(1,0.35*cm))

# LINEA DE TIEMPO
s.append(sec('LÍNEA DE TIEMPO', AZULOSC))
s.append(Spacer(1,0.15*cm))

timeline_data = [
    [Paragraph('<b>Fecha</b>', S_cellB), Paragraph('<b>Evento</b>', S_cellB), Paragraph('<b>Estado</b>', S_cellB)],
    [Paragraph('12–19 jun 2026', S_cell), Paragraph('Purchase funcionaba con normalidad (cientos de eventos/día, picos de 70-96/hora)', S_cell), Paragraph('<font color="#1a7a1a"><b>OK</b></font>', S_cell)],
    [Paragraph('~20 jun 2026', S_cell), Paragraph('Purchase deja de registrarse por completo. PageView/ViewContent siguen funcionando', S_cell), Paragraph('<font color="#b41f1f"><b>ROTO</b></font>', S_cell)],
    [Paragraph('20 jun – 7 jul', S_cell), Paragraph('0 eventos de Purchase/CompleteRegistration en toda la ventana', S_cell), Paragraph('<font color="#b41f1f"><b>ROTO</b></font>', S_cell)],
    [Paragraph('Antes del 13 jul (sesiones previas)', S_cell), Paragraph('Se corrigen: posición del pixel (fuera de &lt;/html&gt;), race condition, falta de eventID, eventos de embudo faltantes (ViewContent/InitiateCheckout/AddPaymentInfo)', S_cell), Paragraph('<font color="#1a7a1a">Corregido</font>', S_cell)],
    [Paragraph('13 jul 2026 (mañana)', S_cell), Paragraph('Auditoría en vivo: se descarta hipótesis de "falta de tráfico"; se identifica que metaPixelCheckout() existe pero no se ejecuta al dar clic en COMPRAR', S_cell), Paragraph('<font color="#a66c00"><b>Diagnosticado</b></font>', S_cell)],
    [Paragraph('13 jul 2026 (mediodía)', S_cell), Paragraph('Prueba en consola confirma: la función funciona perfecto al llamarla a mano; el problema es que el submit del formulario no la invoca (envío nativo) + error get_adicionales rompe JS', S_cell), Paragraph('<font color="#a66c00"><b>Causa confirmada</b></font>', S_cell)],
    [Paragraph('13 jul 2026 (tarde)', S_cell), Paragraph('Desarrollador aplica el fix: elimina get_adicionales, reescribe validación del formulario, asegura que COMPRAR ejecute metaPixelCheckout()', S_cell), Paragraph('<font color="#1a7a1a"><b>Corregido</b></font>', S_cell)],
    [Paragraph('13 jul 2026 (verificación)', S_cell), Paragraph('Prueba real en s-7108 y s-7218: ev=Purchase con Status 200 en Network; contador de Ads Manager sube de 2 a 6 compras en vivo', S_cell), Paragraph('<font color="#1a7a1a"><b>VERIFICADO</b></font>', S_cell)],
]
t = Table(timeline_data, colWidths=[2.6*cm, 10.8*cm, 2.6*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0),AZULOSC),
    ('TEXTCOLOR',(0,0),(-1,0),BLANCO),
    ('GRID',(0,0),(-1,-1),0.5,GRIS2),
    ('VALIGN',(0,0),(-1,-1),'TOP'),
    ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
    ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[BLANCO,GRIS]),
]))
s.append(t)
s.append(Spacer(1,0.4*cm))

# HALLAZGOS Y ESTADO
s.append(sec('HALLAZGOS DEL DIAGNÓSTICO Y ESTADO ACTUAL', ROJO))
s.append(Spacer(1,0.15*cm))

hallazgos = [
    [Paragraph('<b>Hallazgo</b>', S_cellB), Paragraph('<b>Estado</b>', S_cellB)],
    [Paragraph('Pixel colocado después de &lt;/html&gt;', S_cell), Paragraph('<font color="#1a7a1a">Corregido</font>', S_cell)],
    [Paragraph('Race condition (navegación cortaba el beacon antes de salir)', S_cell), Paragraph('<font color="#1a7a1a">Corregido</font>', S_cell)],
    [Paragraph('Sin eventID (imposible deduplicar eventos)', S_cell), Paragraph('<font color="#1a7a1a">Corregido</font>', S_cell)],
    [Paragraph('Faltaban ViewContent / InitiateCheckout / AddPaymentInfo', S_cell), Paragraph('<font color="#1a7a1a">Corregido</font>', S_cell)],
    [Paragraph('Dos pixeles distintos instalados (1272564394151080 y 3662695490547642)', S_cell), Paragraph('<font color="#1a7a1a">Aclarado</font>: el segundo pertenece a otro negocio (GRUPO RIOS NUEVO), sin relación con este sitio', S_cell)],
    [Paragraph('Cuenta de anuncios en estado UNSETTLED (saldo pendiente)', S_cell), Paragraph('<font color="#a66c00">En proceso de pago</font>, no era la causa raíz', S_cell)],
    [Paragraph('Campañas optimizan a "Completar Registro", no a "Compra"', S_cell), Paragraph('<font color="#1a7a1a">Aclarado</font>: coherente con el diseño del sitio (ambos se disparan juntos)', S_cell)],
    [Paragraph('Función get_adicionales rompía el JS con error "Cannot read properties of null"', S_cell), Paragraph('<font color="#1a7a1a"><b>Corregido</b></font> (función eliminada)', S_cell)],
    [Paragraph('El botón COMPRAR no ejecutaba metaPixelCheckout() — CAUSA RAÍZ', S_cell), Paragraph('<font color="#1a7a1a"><b>Corregido y verificado</b></font>', S_cell)],
    [Paragraph('Sorteo s-7088 sin evento InitiateCheckout', S_cell), Paragraph('<font color="#a66c00">Pendiente de confirmar si se corrigió</font>', S_cell)],
    [Paragraph('jQuery duplicado en /genera-tu-boleto', S_cell), Paragraph('<font color="#a66c00">Pendiente de confirmar</font>', S_cell)],
    [Paragraph('EMQ (calidad de coincidencia) estancado en 6.1/10', S_cell), Paragraph('<font color="#a66c00">Pendiente</font> — falta Advanced Matching (teléfono/nombre)', S_cell)],
    [Paragraph('Purchase se registra al enviar formulario, no al confirmar pago real (WhatsApp)', S_cell), Paragraph('<font color="#a66c00">Decisión de negocio</font> — opcional agregar Purchase real vía servidor', S_cell)],
]
t2 = Table(hallazgos, colWidths=[9.5*cm, 6.5*cm])
t2.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0),ROJO),
    ('TEXTCOLOR',(0,0),(-1,0),BLANCO),
    ('GRID',(0,0),(-1,-1),0.5,GRIS2),
    ('VALIGN',(0,0),(-1,-1),'TOP'),
    ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
    ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[BLANCO,GRIS]),
]))
s.append(t2)
s.append(Spacer(1,0.4*cm))

# CAMBIOS APLICADOS POR EL DESARROLLADOR
s.append(sec('CAMBIOS APLICADOS POR EL DESARROLLADOR (13 jul 2026)', VERDE))
s.append(Spacer(1,0.15*cm))
for n,t_ in [
  ('1','Eliminó la función get_adicionales(), que llamaba a /obtener-adicionales/{id} y rompía el JavaScript cuando el servidor devolvía null.'),
  ('2','Reescribió la validación del formulario de compra: el botón COMPRAR ahora se habilita/deshabilita dinámicamente según si los campos (teléfono a 10 dígitos, nombre, apellidos, estado) son válidos.'),
  ('3','Aseguró que el envío del formulario ejecute window.metaPixelCheckout() antes de navegar, disparando Purchase y CompleteRegistration con el mismo eventID.'),
]:
    s.append(Table([[Paragraph(f'<b>{n}</b>',sty('nn',fontSize=9,textColor=BLANCO,alignment=TA_CENTER)),
                     Paragraph(t_, sty('tt',fontSize=9,leading=13))]],
        colWidths=[0.9*cm, W-4.1*cm],
        style=TableStyle([('BACKGROUND',(0,0),(0,0),VERDE),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                          ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                          ('LEFTPADDING',(1,0),(1,0),8)])))
    s.append(Spacer(1,0.12*cm))

s.append(Spacer(1,0.25*cm))

# VERIFICACION
s.append(sec('VERIFICACIÓN — 3 fuentes independientes', VERDE))
s.append(Spacer(1,0.15*cm))
s.append(box(
    '<b>1. Código:</b> confirmado que fbq, window.metaPixelData y window.metaPixelCheckout están '
    'definidos y funcionan; el error de get_adicionales ya no aparece.<br/><br/>'
    '<b>2. Red del navegador (Network):</b> compra real de prueba en s-7108 y s-7218 → aparece '
    'tr?id=1272564394151080&ev=Purchase con Status 200 (confirmación de Facebook).<br/><br/>'
    '<b>3. Reporte de Facebook Ads Manager:</b> el contador de "Compras" de la cuenta Ernesto '
    'Marroquin Transfer subió de 2 a 6 en tiempo real durante las pruebas, con actualización de '
    'datos de "hace menos de un minuto".',
    colors.HexColor('#edf7ed'), VERDE, colors.HexColor('#14521a')))
s.append(Spacer(1,0.4*cm))

# SIGUIENTES PASOS
s.append(sec('SIGUIENTES PASOS', AMBAR))
s.append(Spacer(1,0.15*cm))
for n,t_ in [
  ('1','Monitorear 1-2 días que las compras reales sigan entrando de forma orgánica (sin necesidad de pruebas manuales). Las 6 compras del 13 de julio son pruebas, no ventas reales — descartarlas de cualquier análisis de resultados.'),
  ('2','Confirmar que el sorteo s-7088 (y cualquier otro con plantilla antigua) ya tenga el evento InitiateCheckout.'),
  ('3','Confirmar si se eliminó el jQuery duplicado en /genera-tu-boleto.'),
  ('4','(Opcional) Implementar Advanced Matching — enviar teléfono/nombre hasheados al pixel para subir el EMQ desde 6.1.'),
  ('5','(Opcional) Agregar un evento Purchase real vía Conversions API en el momento en que se confirma el pago por WhatsApp, para medir ingresos reales y no solo intención de compra.'),
]:
    s.append(Table([[Paragraph(f'<b>{n}</b>',sty('nn2',fontSize=9,textColor=BLANCO,alignment=TA_CENTER)),
                     Paragraph(t_, sty('tt2',fontSize=9,leading=13))]],
        colWidths=[0.9*cm, W-4.1*cm],
        style=TableStyle([('BACKGROUND',(0,0),(0,0),AMBAR),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                          ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                          ('LEFTPADDING',(1,0),(1,0),8)])))
    s.append(Spacer(1,0.12*cm))

doc.build(s, onFirstPage=_pg, onLaterPages=_pg)
print('PDF generado.')
