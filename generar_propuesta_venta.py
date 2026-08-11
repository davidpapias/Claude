from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
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

S_body = sty('body', fontSize=9.7, leading=14.5, spaceAfter=5)
S_sub  = sty('sub',  fontSize=10.5, textColor=AZUL, fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=3)
S_quote= sty('quote', fontSize=10, leading=15, textColor=colors.HexColor('#333333'), leftIndent=10, fontName='Helvetica-Oblique')
S_cell = sty('cell', fontSize=8.7, leading=12)
S_cellB= sty('cellB', fontSize=8.7, leading=12, fontName='Helvetica-Bold')

def _pg(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawCentredString(W/2, 1*cm, f'Propuesta de Servicios · Meta Pixel & Optimización de Conversiones · {HOY} · Pág. {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate('/home/user/Claude/propuesta_venta_cliente.pdf', pagesize=A4,
                        rightMargin=1.6*cm, leftMargin=1.6*cm, topMargin=1.8*cm, bottomMargin=1.6*cm,
                        title='Propuesta de Servicios - Meta Pixel')

def sec(text, color=AZULOSC):
    return Table([[Paragraph(f'  {text}', sty('sh',fontSize=11,textColor=BLANCO,fontName='Helvetica-Bold'))]],
        colWidths=[W-3.2*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('TOPPADDING',(0,0),(-1,-1),6),
                          ('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),6)]))

def box(text, bg, border, tc):
    return Table([[Paragraph(text, sty('bx',fontSize=9.5,textColor=tc,leading=13.5))]], colWidths=[W-3.2*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('BOX',(0,0),(-1,-1),0.8,border),
                          ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
                          ('LEFTPADDING',(0,0),(-1,-1),11),('RIGHTPADDING',(0,0),(-1,-1),11)]))

def numbered(items, color, w=0.9):
    out = []
    for n, t in items:
        out.append(Table([[Paragraph(f'<b>{n}</b>',sty('nn',fontSize=9,textColor=BLANCO,alignment=TA_CENTER)),
                           Paragraph(t, sty('tt',fontSize=9.3,leading=13.5))]],
            colWidths=[w*cm, W-3.2*cm-w*cm-0.2*cm],
            style=TableStyle([('BACKGROUND',(0,0),(0,0),color),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                              ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
                              ('LEFTPADDING',(1,0),(1,0),8)])))
        out.append(Spacer(1,0.14*cm))
    return out

s = []

# ============ PORTADA ============
s.append(Spacer(1, 2*cm))
s.append(Table([[Paragraph('PROPUESTA DE SERVICIOS', sty('t',fontSize=20,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),20),('BOTTOMPADDING',(0,0),(-1,-1),20)])))
s.append(Spacer(1,0.2*cm))
s.append(Table([[Paragraph('Optimización de Conversiones y Meta Pixel', sty('t2',fontSize=13,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.2*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e8f0fa')),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)])))
s.append(Spacer(1,1.5*cm))
s.append(box(
    f'<b>Preparado para:</b> Ernesto Marroquin Transfer · eventosptovallartatransfer.com<br/>'
    f'<b>Fecha:</b> {HOY}',
    colors.HexColor('#f5f5f5'), GRIS2, colors.HexColor('#333')))
s.append(Spacer(1,3*cm))
s.append(Paragraph('Esta propuesta se basa en una auditoría real, con datos verificados de tu propia '
    'cuenta — no en generalidades.', sty('foot',fontSize=10,alignment=TA_CENTER,textColor=colors.HexColor('#666'))))
s.append(PageBreak())

# ============ EL PROBLEMA ============
s.append(sec('1. LO QUE ENCONTRAMOS EN TU CUENTA', ROJO))
s.append(Spacer(1,0.2*cm))
s.append(Paragraph(
    'Facebook te dice que llegaron <b>22 personas listas para comprar</b>. Tu sistema solo '
    'registró <b>2</b>. Eso no es un error de reporte — son <b>20 ventas que existieron y se '
    'perdieron en el camino</b>. Y lo más importante: le estás pagando a Facebook por esas 22, '
    'aunque solo cobraste 2.', S_body))
s.append(Spacer(1,0.15*cm))
s.append(box(
    '<b>Un segundo hallazgo, más reciente y más serio:</b> el sitio se migró a una nueva '
    'plataforma (Next.js) hace unas semanas. En esa migración, <b>el 66% del sistema de '
    'medición de Facebook se perdió</b> — de los 6 eventos que hacen funcionar tus campañas '
    '(Ver contenido, Iniciar compra, Agregar pago, Completar registro, <b>Compra</b>), solo '
    'sobrevivieron 2. <b>El evento de Compra desapareció por completo, sin que nadie se diera '
    'cuenta hasta hoy.</b>',
    colors.HexColor('#fde8e8'), ROJO, colors.HexColor('#7a1414')))
s.append(Spacer(1,0.3*cm))
s.append(Paragraph('El costo de no actuar:', S_sub))
s.append(Paragraph('Si cada boleto vale entre $300 y $450 pesos, y estás perdiendo 20 de cada 22 '
    'intentos, eso son <b>entre $6,000 y $9,000 pesos perdidos en un solo día</b> — sin contar lo '
    'que ya gastaste en el anuncio para atraer a esas personas.', S_body))

# ============ ESCENARIOS ============
s.append(Spacer(1,0.3*cm))
s.append(sec('2. LAS 5 FUGAS QUE IDENTIFICAMOS', AMBAR))
s.append(Spacer(1,0.2*cm))

escenarios = [
    ('El aviso llega antes que la venta', 'Tu sistema le avisa a Facebook "ya vendí" ANTES de guardar la reserva real. Si el cliente cierra la pantalla o pierde señal en ese instante, Facebook ya cobró — pero tú nunca te enteraste.'),
    ('El salto a WhatsApp que nunca llega', 'Sin WhatsApp instalado, o con la conexión cortada, el cliente simplemente desaparece. No hay ningún aviso — se queda sin opción para completar su compra.'),
    ('La reserva que se enfría sola', 'Boletos "Apartados" esperando pago por 18-22 horas sin seguimiento. Se liberan solos y probablemente pierdes también al cliente.'),
    ('Facebook no sabe qué SÍ se cobró de verdad', 'Hoy Facebook cuenta como "venta" el momento del clic, no el pago confirmado — tus anuncios se optimizan con datos que no reflejan ingresos reales.'),
    ('La migración de plataforma que dejó el pixel a la mitad', 'El cambio a Next.js reescribió el código de medición, pero solo se completaron 2 de 6 eventos. El de Compra — el más importante — no existe hoy en el sitio.'),
]
for i, (titulo, desc) in enumerate(escenarios, 1):
    s.append(Paragraph(f'<b>Escenario {chr(64+i)} — {titulo}</b>', S_sub))
    s.append(Paragraph(desc, S_body))

# ============ LA SOLUCION ============
s.append(Spacer(1,0.3*cm))
s.append(sec('3. LA SOLUCIÓN — EN 3 NIVELES', VERDE))
s.append(Spacer(1,0.2*cm))

niveles = [
    ['BÁSICO', 'Arreglar lo que ya sabemos que está roto', '• Reimplementar los 4 eventos faltantes (incluyendo Compra)\n• Advanced Matching completo\n• Purchase real al confirmar pago'],
    ['CRECIMIENTO', 'Recuperar y visibilizar', '• Todo lo del nivel Básico\n• Remarketing a reservas sin pagar\n• Dashboard de visitas → reservas → pagados en tiempo real'],
    ['RETAINER MENSUAL', 'Nunca más te agarran en curva', '• Todo lo del nivel Crecimiento\n• Auditoría periódica del pixel\n• Alerta automática si las compras caen a 0\n• Checklist de QA en cada cambio del sitio'],
]
data = [[Paragraph('<b>Nivel</b>',S_cellB), Paragraph('<b>Posicionamiento</b>',S_cellB), Paragraph('<b>Incluye</b>',S_cellB)]]
for n in niveles:
    data.append([Paragraph(f'<b>{n[0]}</b>',S_cell), Paragraph(n[1],S_cell), Paragraph(n[2].replace(chr(10),'<br/>'),S_cell)])
t = Table(data, colWidths=[3*cm, 4*cm, 9.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0),AZULOSC), ('TEXTCOLOR',(0,0),(-1,0),BLANCO),
    ('GRID',(0,0),(-1,-1),0.5,GRIS2), ('VALIGN',(0,0),(-1,-1),'TOP'),
    ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[BLANCO,GRIS]),
]))
s.append(t)

s.append(Spacer(1,0.3*cm))
s.append(box(
    '<b>¿Por qué el Retainer es el nivel recomendado?</b> Porque ya viste que puede pasar dos '
    'veces: primero un bug de código, después una migración de plataforma completa. Ambas '
    'veces el pixel se rompió <b>sin ningún aviso</b>, y solo se detectó por una revisión manual, '
    'semanas después. Un servicio recurrente convierte "descubrirlo tarde" en "saberlo el mismo día".',
    colors.HexColor('#edf7ed'), VERDE, colors.HexColor('#14521a')))

# ============ CIERRE ============
s.append(Spacer(1,0.35*cm))
s.append(sec('4. PRÓXIMO PASO', AZULOSC))
s.append(Spacer(1,0.2*cm))
s.append(Paragraph(
    'La pregunta no es si tienes fugas — ya las vimos, con tus propios números, dos veces. '
    'La pregunta es cuántas más vas a dejar pasar mientras decides. Empecemos con el nivel '
    'Básico, que resuelve lo más urgente esta misma semana, y evaluamos juntos el paso al '
    'Retainer una vez que veas los resultados.', S_body))

doc.build(s, onFirstPage=_pg, onLaterPages=_pg)
print('PDF generado.')
