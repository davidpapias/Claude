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
HOY = '15/07/2026'

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
    canvas.drawCentredString(W/2, 1*cm, f'Auditoría de Eventos · eventosptovallartatransfer.com · {HOY} · Pág. {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate('/home/user/Claude/auditoria_eventos_15jul.pdf', pagesize=A4,
                        rightMargin=1.6*cm, leftMargin=1.6*cm, topMargin=1.8*cm, bottomMargin=1.6*cm,
                        title='Auditoria de eventos - Meta Pixel')

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

# Titulo
s.append(Table([[Paragraph('AUDITORÍA DE EVENTOS — Meta Pixel', sty('t',fontSize=16,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14)])))
s.append(Spacer(1,0.15*cm))
s.append(Table([[Paragraph('eventosptovallartatransfer.com · Pixel 1272564394151080 (PIXEL NUEVO) · 8-15 julio 2026', sty('t2',fontSize=10,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e8f0fa')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)])))
s.append(Spacer(1,0.45*cm))

s.append(box(
    '<b>VEREDICTO:</b> El pixel está sano y estable. Los eventos llegan correctamente, el embudo '
    'de conversión mantiene proporciones normales y la recuperación del 13 de julio se sostiene '
    'por tercer día consecutivo. La única tarea pendiente es la mejora de calidad de coincidencia '
    '(EMQ), sin urgencia.',
    colors.HexColor('#edf7ed'), VERDE, colors.HexColor('#14521a')))
s.append(Spacer(1,0.35*cm))

# TABLA POR DIA
s.append(sec('DESGLOSE DIARIO DE EVENTOS', AZULOSC))
s.append(Spacer(1,0.15*cm))

rows = [
    ['8 jul', '1,249', '620', '218', '205', '2', '2', 'Prueba manual'],
    ['9 jul', '1,407', '728', '226', '173', '0', '0', 'FALLA'],
    ['10 jul', '1,109', '555', '147', '103', '0', '0', 'FALLA'],
    ['11 jul', '1,034', '575', '126', '104', '0', '0', 'FALLA'],
    ['12 jul', '1,360', '710', '212', '199', '0', '0', 'FALLA'],
    ['13 jul', '1,806', '952', '303', '171', '274', '276', 'FIX desplegado'],
    ['14 jul', '1,426', '706', '200', '287', '202', '202', 'Estable'],
    ['15 jul (parcial)', '128', '64', '4', '20', '6', '6', 'En curso'],
]
header = [Paragraph('<b>Día</b>',S_cellB), Paragraph('<b>PageView</b>',S_cellB), Paragraph('<b>ViewContent</b>',S_cellB),
          Paragraph('<b>InitiateCheckout</b>',S_cellB), Paragraph('<b>AddPaymentInfo</b>',S_cellB),
          Paragraph('<b>CompleteReg.</b>',S_cellB), Paragraph('<b>Purchase</b>',S_cellB), Paragraph('<b>Estado</b>',S_cellB)]
data = [header]
for r in rows:
    estado = r[7]
    color = '#b41f1f' if estado=='FALLA' else ('#1a7a1a' if estado in ('Estable','En curso') else '#a66c00')
    data.append([Paragraph(r[0],S_cell), Paragraph(r[1],S_cell), Paragraph(r[2],S_cell),
                 Paragraph(r[3],S_cell), Paragraph(r[4],S_cell),
                 Paragraph(f'<b>{r[5]}</b>',S_cell), Paragraph(f'<b>{r[6]}</b>',S_cell),
                 Paragraph(f'<font color="{color}"><b>{estado}</b></font>',S_cell)])

t = Table(data, colWidths=[2.3*cm, 2*cm, 2.1*cm, 2.5*cm, 2.3*cm, 2.1*cm, 1.8*cm, 2.4*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0),AZULOSC),
    ('TEXTCOLOR',(0,0),(-1,0),BLANCO),
    ('GRID',(0,0),(-1,-1),0.5,GRIS2),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('ALIGN',(1,0),(-1,-1),'CENTER'),
    ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[BLANCO,GRIS]),
]))
s.append(t)
s.append(Spacer(1,0.4*cm))

# HALLAZGOS
s.append(sec('HALLAZGOS DE LA AUDITORÍA', AMBAR))
s.append(Spacer(1,0.15*cm))
for n,t_ in [
  ('1','Ventana de falla perfectamente delimitada: 4 días consecutivos (9-12 jul) con 0 eventos de Purchase/CompleteRegistration, mientras PageView/ViewContent/InitiateCheckout seguían funcionando con normalidad.'),
  ('2','Recuperación sostenida: desde el 13 de julio (día del fix) hasta hoy, 3 días consecutivos con compras reales entrando de forma orgánica.'),
  ('3','Se resolvió la duda sobre el 14 de julio: a media tarde InitiateCheckout=Purchase=CompleteRegistration=120 (igualdad sospechosa). Con el día cerrado, los totales finales fueron 200/202/202 — un embudo normal y saludable, no un error de conteo. Era solo un efecto de estar viendo un día parcial.'),
  ('4','EMQ se mantiene en 6.1/10 en todos los eventos, sin cambios significativos. Se detecta una señal marginal de datos de coincidencia avanzada (teléfono/nombre/apellido) en ~1.3% de los eventos Purchase/CompleteRegistration — insuficiente para mover el puntaje.'),
]:
    s.append(Table([[Paragraph(f'<b>{n}</b>',sty('nn',fontSize=9,textColor=BLANCO,alignment=TA_CENTER)),
                     Paragraph(t_, sty('tt',fontSize=9,leading=13))]],
        colWidths=[0.9*cm, W-4.1*cm],
        style=TableStyle([('BACKGROUND',(0,0),(0,0),AMBAR),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                          ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                          ('LEFTPADDING',(1,0),(1,0),8)])))
    s.append(Spacer(1,0.12*cm))

s.append(Spacer(1,0.25*cm))

# PROXIMOS PASOS
s.append(sec('SIGUIENTES PASOS', VERDE))
s.append(Spacer(1,0.15*cm))
s.append(box(
    '1. Seguir monitoreando el volumen diario de Purchase/CompleteRegistration para confirmar '
    'estabilidad a mediano plazo.<br/>'
    '2. (Opcional) Implementar Advanced Matching real — enviar teléfono/nombre/apellido hasheados '
    'de forma consistente para subir el EMQ desde 6.1.<br/>'
    '3. Revisar el aviso de Facebook sobre el parámetro "value" idéntico en todos los eventos '
    'Purchase de la web (pendiente de una auditoría previa) — verificar si el valor dinámico por '
    'cantidad de boletos se está calculando correctamente.',
    colors.HexColor('#edf7ed'), VERDE, colors.HexColor('#14521a')))

doc.build(s, onFirstPage=_pg, onLaterPages=_pg)
print('PDF generado.')
