from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import datetime

W, H = A4
AZUL   = colors.HexColor('#2c70ba')
AZULOSC= colors.HexColor('#1c4f85')
ROJO   = colors.HexColor('#b41f1f')
VERDE  = colors.HexColor('#1a7a1a')
GRIS   = colors.HexColor('#f0f0f0')
GRIS2  = colors.HexColor('#d0d0d0')
BLANCO = colors.white
NEGRO  = colors.black
HOY = datetime.date.today().strftime('%d/%m/%Y')

base = getSampleStyleSheet()
def sty(name, parent='Normal', **kw):
    return ParagraphStyle(name, parent=base[parent], **kw)

S_body = sty('body', fontSize=9.5, leading=14, spaceAfter=5)
S_sub  = sty('sub',  fontSize=10, textColor=AZUL, fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=3)
S_code = sty('code', fontSize=7.8, fontName='Courier', leading=11)

def _pg(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawCentredString(W/2, 1*cm, f'Diagnóstico Meta Pixel · eventosptovallartatransfer.com · {HOY} · Pág. {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate('/home/user/Claude/diagnostico_final_purchase.pdf', pagesize=A4,
                        rightMargin=1.7*cm, leftMargin=1.7*cm, topMargin=1.8*cm, bottomMargin=1.6*cm,
                        title='Diagnóstico Final - Purchase no se dispara')

def sec(text, color):
    return Table([[Paragraph(f'  {text}', sty('sh',fontSize=11,textColor=BLANCO,fontName='Helvetica-Bold'))]],
        colWidths=[W-3.4*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('TOPPADDING',(0,0),(-1,-1),6),
                          ('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),6)]))

def box(text, bg, border, tc):
    return Table([[Paragraph(text, sty('bx',fontSize=9.5,textColor=tc,leading=13))]],
        colWidths=[W-3.4*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('BOX',(0,0),(-1,-1),0.8,border),
                          ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
                          ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)]))

def code(text):
    return Table([[Paragraph(text.replace('\n','<br/>').replace(' ','&nbsp;'), S_code)]],
        colWidths=[W-3.4*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),GRIS),('BOX',(0,0),(-1,-1),0.5,GRIS2),
                          ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
                          ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8)]))

s = []

# Portada / título
s.append(Table([[Paragraph('DIAGNÓSTICO — Evento Purchase no se dispara', sty('t',fontSize=16,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.4*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14)])))
s.append(Spacer(1,0.15*cm))
s.append(Table([[Paragraph('Meta Pixel 1272564394151080 · eventosptovallartatransfer.com', sty('t2',fontSize=10,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.4*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e8f0fa')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)])))
s.append(Spacer(1,0.5*cm))

# Conclusión
s.append(box(
    '<b>CAUSA RAÍZ (confirmada en vivo, no es hipótesis):</b><br/>'
    'El código del evento <b>Purchase</b> existe y funciona, pero el botón <b>COMPRAR no lo está '
    'llamando</b>. El formulario se envía de forma nativa (POST directo al servidor) y se salta el '
    'código del pixel. Por eso Facebook registra 0 compras, aunque PageView, ViewContent e '
    'InitiateCheckout sí funcionan. No es la cuenta pausada, ni el tráfico, ni el pixel mal instalado.',
    colors.HexColor('#fde8e8'), ROJO, colors.HexColor('#7a1414')))
s.append(Spacer(1,0.4*cm))

# Cómo se verificó
s.append(sec('CÓMO SE VERIFICÓ (prueba en vivo, DevTools)', AZULOSC))
s.append(Spacer(1,0.2*cm))
s.append(Paragraph('Se realizó una compra de prueba real en /s-7108 con la pestaña Network abierta '
    '("Preserve log" activado, filtro <b>tr</b>) y la consola del navegador:', S_body))

s.append(Paragraph('1. El pixel base y las funciones existen y están cargadas:', S_sub))
s.append(code(
    "> typeof fbq                        → 'function'\n"
    "> typeof window.metaPixelData        → 'function'\n"
    "> typeof window.metaPixelCheckout    → 'function'"))

s.append(Paragraph('2. Al hacer clic en COMPRAR, en Network SOLO aparecen estos eventos:', S_sub))
s.append(code(
    "tr?id=1272564394151080&ev=PageView          ✓ presente\n"
    "tr?id=1272564394151080&ev=ViewContent        ✓ presente\n"
    "tr?id=1272564394151080&ev=InitiateCheckout   ✓ presente\n"
    "tr?id=1272564394151080&ev=Purchase           ✗ NO aparece\n"
    "tr?id=1272564394151080&ev=CompleteRegistration ✗ NO aparece"))
s.append(Paragraph('(Filtrando Network por "Purchase" el resultado quedó completamente vacío.)', sty('n',fontSize=8.5,textColor=colors.HexColor('#666'))))

s.append(Paragraph('3. Al llamar la función manualmente en la consola, SÍ dispara el Purchase:', S_sub))
s.append(code(
    "> window.metaPixelCheckout(function(){ console.log('CALLBACK OK'); })\n"
    "  [Meta Pixel] Purchase enviado. eventID=ck-1783557639763-hooyxfxzj value=300\n"
    "  CALLBACK OK"))
s.append(box(
    '<b>Conclusión de la prueba 3:</b> la función <font face="Courier">metaPixelCheckout()</font> '
    'funciona perfectamente cuando se le llama. Por lo tanto el problema NO está en la función, sino '
    'en que <b>el envío del formulario no la ejecuta</b>.',
    colors.HexColor('#edf7ed'), VERDE, colors.HexColor('#14521a')))

# Qué revisar / fix
s.append(Spacer(1,0.3*cm))
s.append(sec('QUÉ REVISAR Y CÓMO CORREGIRLO (desarrollador)', ROJO))
s.append(Spacer(1,0.2*cm))
s.append(Paragraph('En <font face="Courier">ticket.js</font>, el handler de <font face="Courier">submit</font> '
    'debe llamar <font face="Courier">window.metaPixelCheckout(enviarFormulario)</font> dentro del bloque '
    '<font face="Courier">if (error != 1)</font>. Ese llamado NO se está ejecutando. Revisar, en orden:', S_body))

for n,t in [
  ('1','¿El <font face="Courier">addEventListener(\'submit\', ...)</font> de ticket.js está realmente enganchado al <font face="Courier">#form-ticket</font> en esta plantilla? (puede que create()/init() no corra o enlace el elemento equivocado).'),
  ('2','¿El error de JavaScript <font face="Courier">Uncaught TypeError: Cannot read properties of null (reading \'number\')</font> en <font face="Courier">get_adicionales</font> está rompiendo la ejecución ANTES de que se enganche el handler? (el endpoint <font face="Courier">/s-XXXX/obtener-adicionales/{id}</font> está devolviendo null).'),
  ('3','¿El botón COMPRAR hace un submit nativo que se salta el listener (falta preventDefault, o hay un segundo camino de envío)?'),
]:
    s.append(Table([[Paragraph(f'<b>{n}</b>',sty('nn',fontSize=9,textColor=BLANCO,alignment=TA_CENTER)),
                     Paragraph(t, sty('tt',fontSize=9,leading=13))]],
        colWidths=[0.9*cm, W-4.3*cm],
        style=TableStyle([('BACKGROUND',(0,0),(0,0),AZUL),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
                          ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                          ('LEFTPADDING',(1,0),(1,0),8)])))
    s.append(Spacer(1,0.12*cm))

s.append(Paragraph('Corrección adicional — evitar que get_adicionales truene con null:', S_sub))
s.append(code(
    "success: function(data) {\n"
    "    adiccionales = (data && data.number) ? data.number : '';\n"
    "}"))

s.append(Spacer(1,0.3*cm))
s.append(box(
    '<b>Resultado esperado tras el fix:</b> al dar clic en COMPRAR debe aparecer en Network '
    '<font face="Courier">tr?id=1272564394151080&ev=Purchase</font> y '
    '<font face="Courier">&ev=CompleteRegistration</font>, y en consola el mensaje '
    '<font face="Courier">[Meta Pixel] Purchase enviado</font>. Verificable con el mismo método '
    '(Network, filtro "tr", Preserve log activado).',
    colors.HexColor('#e6f0fa'), AZUL, colors.HexColor('#1c3d5c')))

doc.build(s, onFirstPage=_pg, onLaterPages=_pg)
print('PDF generado.')
