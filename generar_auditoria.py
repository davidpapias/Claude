from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import datetime

W, H = A4
AZUL   = colors.HexColor('#2c70ba')
AZULOSC= colors.HexColor('#1c4f85')
ROJO   = colors.HexColor('#b41f1f')
NARANJA= colors.HexColor('#c87000')
AMBAR  = colors.HexColor('#7a6000')
VERDE  = colors.HexColor('#1a7a1a')
GRIS   = colors.HexColor('#f0f0f0')
GRIS2  = colors.HexColor('#d0d0d0')
BLANCO = colors.white
NEGRO  = colors.black
HOY = datetime.date.today().strftime('%d/%m/%Y')

base = getSampleStyleSheet()
def sty(name, parent='Normal', **kw):
    return ParagraphStyle(name, parent=base[parent], **kw)

S_body = sty('body', fontSize=9.5, leading=14, spaceAfter=4)
S_sub  = sty('sub',  fontSize=9.5, textColor=AZUL, fontName='Helvetica-Bold', spaceBefore=6, spaceAfter=2)
S_h    = sty('h', fontSize=13, textColor=AZUL, fontName='Helvetica-Bold', spaceAfter=4)
S_code = sty('code', fontSize=7.5, fontName='Courier', leading=11, leftIndent=4)

def _pg(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawCentredString(W/2, 1*cm, f'Auditoría Meta Pixel · eventosptovallartatransfer.com · {HOY} · Pág. {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate('/home/user/Claude/auditoria_completa_pixel.pdf', pagesize=A4,
                        rightMargin=1.7*cm, leftMargin=1.7*cm, topMargin=1.8*cm, bottomMargin=1.6*cm,
                        title='Auditoría Completa Meta Pixel')

def sec_header(text, color):
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

story = []

# ══════════════ PORTADA ══════════════
story.append(Spacer(1, 2*cm))
story.append(Table([[Paragraph('AUDITORÍA COMPLETA', sty('t1',fontSize=26,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.4*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),22),('BOTTOMPADDING',(0,0),(-1,-1),10)])))
story.append(Table([[Paragraph('Meta Pixel &amp; Conversiones', sty('t2',fontSize=15,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
    colWidths=[W-3.4*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZULOSC),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),18)])))
story.append(Spacer(1, 0.6*cm))
story.append(Paragraph('eventosptovallartatransfer.com', sty('t3',fontSize=13,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER)))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(f'Fecha: {HOY}', sty('t4',fontSize=10,alignment=TA_CENTER,textColor=colors.HexColor('#555555'))))
story.append(Spacer(1, 1.2*cm))

# Datos maestros en portada
md = [
    [Paragraph('<b>Elemento</b>',sty('m0',fontSize=9,textColor=BLANCO)), Paragraph('<b>Identificador</b>',sty('m0b',fontSize=9,textColor=BLANCO)), Paragraph('<b>Nota</b>',sty('m0c',fontSize=9,textColor=BLANCO))],
    [Paragraph('PIXEL NUEVO',sty('m1',fontSize=8.5)), Paragraph('1272564394151080',sty('m1b',fontSize=8.5)), Paragraph('La web dispara aquí',sty('m1c',fontSize=8.5))],
    [Paragraph('PIXEL NUEVO NUEVO',sty('m2',fontSize=8.5)), Paragraph('3662695490547642',sty('m2b',fontSize=8.5)), Paragraph('2º pixel — por diagnosticar',sty('m2c',fontSize=8.5))],
    [Paragraph('Cuenta de campañas',sty('m3',fontSize=8.5)), Paragraph('1942278216304903',sty('m3b',fontSize=8.5)), Paragraph('Ernesto Marroquin Transfer',sty('m3c',fontSize=8.5))],
]
t = Table(md, colWidths=[4.2*cm, 5*cm, 5.5*cm])
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),AZUL),('GRID',(0,0),(-1,-1),0.4,GRIS2),
    ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),6),
    ('BACKGROUND',(0,1),(-1,-1),colors.HexColor('#f5f8fc'))]))
story.append(t)
story.append(PageBreak())

# ══════════════ RESUMEN EJECUTIVO ══════════════
story.append(Paragraph('Resumen ejecutivo', S_h))
story.append(HRFlowable(width='100%', thickness=1, color=AZUL))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(
    'Se auditó el sistema de medición del sitio desde tres frentes: <b>(1)</b> el código de la web, '
    '<b>(2)</b> el lado de Facebook vía la API de Meta Ads, y <b>(3)</b> la estructura de negocios y '
    'cuentas publicitarias. Durante la auditoría se descubrió además un <b>segundo pixel</b>.', S_body))
story.append(Spacer(1, 0.2*cm))
story.append(box(
    '<b>Conclusión principal:</b> Los arreglos de la web funcionaron y los eventos del embudo ya llegan '
    'a Facebook. Quedan tres frentes de peso: <b>(1)</b> nunca se registra la compra (Purchase = 0); '
    '<b>(2)</b> la calidad de coincidencia es media (EMQ 6.1) por falta de datos de cliente; y '
    '<b>(3)</b> existe un segundo pixel que —de estar seleccionado en las campañas— explicaría por qué '
    '"el pixel no registra". Este último punto es la prioridad a confirmar.',
    colors.HexColor('#fff8dc'), colors.HexColor('#c8a000'), colors.HexColor('#5a4000')))
story.append(Spacer(1, 0.4*cm))

# Tabla severidad/estado global
story.append(Paragraph('Cuadro de hallazgos', sty('h2',fontSize=12,textColor=AZUL,fontName='Helvetica-Bold',spaceAfter=4)))
hdr = [Paragraph(f'<b>{h}</b>',sty(f'gh{i}',fontSize=8.5,textColor=BLANCO)) for i,h in enumerate(['Área','Hallazgo','Severidad','Estado'])]
filas = [
    ('Web','Instalación del pixel y disparo de eventos del embudo','Crítico','✓ Corregido','ok'),
    ('Web','Purchase disparaba antes/en errores; sin eventID; value fijo','Alto','Parcial','warn'),
    ('Web','jQuery duplicado en genera-tu-boleto','Medio','Pendiente','warn'),
    ('Facebook','Purchase = 0 (nunca se envía)','Crítico','Pendiente','bad'),
    ('Facebook','EMQ 6.1 — sin teléfono/nombre/email','Alto','Pendiente','warn'),
    ('Facebook','AddPaymentInfo con value 0 / embudo suelto','Medio','Pendiente','warn'),
    ('Cuentas','Pixel y campañas en negocios distintos (posible no compartido)','Crítico','Verificar','bad'),
    ('Cuentas','GRUPO RIOS NUEVO inhabilitada por actividad inusual','Info','Informativo','warn'),
    ('Pixeles','Existe un 2º pixel (PIXEL NUEVO NUEVO)','Crítico','Verificar','bad'),
]
col = {'ok':colors.HexColor('#e6f4e6'),'warn':colors.HexColor('#fff3dc'),'bad':colors.HexColor('#fde8e8')}
data = [hdr]
for f in filas:
    data.append([
        Paragraph(f[0],sty('a',fontSize=8.5,fontName='Helvetica-Bold')),
        Paragraph(f[1],sty('b',fontSize=8.5)),
        Paragraph(f[2],sty('c',fontSize=8.5,alignment=TA_CENTER)),
        Paragraph(f[3],sty('d',fontSize=8.5,alignment=TA_CENTER)),
    ])
t = Table(data, colWidths=[2*cm, 8.6*cm, 2*cm, 2.6*cm])
ts = TableStyle([('BACKGROUND',(0,0),(-1,0),AZUL),('GRID',(0,0),(-1,-1),0.4,GRIS2),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
    ('LEFTPADDING',(0,0),(-1,-1),5)])
for i,f in enumerate(filas):
    ts.add('BACKGROUND',(0,i+1),(-1,i+1),col[f[4]])
t.setStyle(ts)
story.append(t)
story.append(PageBreak())

# ══════════════ SECCIÓN A ══════════════
story.append(sec_header('SECCIÓN A — Lado Web (código del sitio)', AZUL))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(
    'Se auditó el código del Pixel en el sitio. Los eventos del embudo, antes ausentes, ya se disparan '
    'y llegan a Facebook (confirmado en la Sección B). Estado por hallazgo:', S_body))
awd = [
    [Paragraph('<b>#</b>',sty('x',fontSize=8.5,textColor=BLANCO)),Paragraph('<b>Hallazgo</b>',sty('x2',fontSize=8.5,textColor=BLANCO)),Paragraph('<b>Estado</b>',sty('x3',fontSize=8.5,textColor=BLANCO))],
    ['1','Pixel colocado fuera de </html> en las 4 páginas','✓ Corregido'],
    ['2','Race condition: la navegación abortaba el beacon','✓ Corregido'],
    ['3','Purchase disparaba en cada click, aun con validación fallida','✓ Corregido'],
    ['4','value hardcodeado a $300 (no refleja promociones)','Revisar'],
    ['5','Faltaban ViewContent / InitiateCheckout / AddPaymentInfo','✓ Corregido'],
    ['6','Purchase se enviaba antes del pago real','Pendiente (ver B)'],
    ['7','id del sorteo hardcodeado como 113','Revisar'],
    ['8','Eventos sin eventID (no deduplicables)','Revisar'],
    ['9','jQuery duplicado en /genera-tu-boleto','Pendiente'],
]
rows=[awd[0]]
for r in awd[1:]:
    rows.append([Paragraph(r[0],sty('n',fontSize=8.5,alignment=TA_CENTER)),Paragraph(r[1],sty('t',fontSize=8.5)),Paragraph(r[2],sty('s',fontSize=8.5,alignment=TA_CENTER))])
t=Table(rows,colWidths=[1*cm,11.7*cm,2.5*cm])
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),AZUL),('GRID',(0,0),(-1,-1),0.4,GRIS2),
    ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),5),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
story.append(t)
story.append(Spacer(1, 0.4*cm))

# ══════════════ SECCIÓN B ══════════════
story.append(sec_header('SECCIÓN B — Lado Facebook (API Meta, PIXEL NUEVO 1272564394151080)', VERDE))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph('Datos reales de la API de Meta, ventana 28/jun – 05/jul.', S_body))
story.append(Paragraph('Lo que funciona:', S_sub))
for p in ['Pixel ACTIVO; disparo reciente por navegador y por servidor.',
          'Embudo llegando con volumen alto: PageView, ViewContent, InitiateCheckout, AddPaymentInfo.',
          'Integración de servidor (CAPI) propia espejando navegador↔servidor casi 1:1 (deduplicación operando). Gateway de Meta: NOT_ONBOARDED.']:
    story.append(Paragraph(f'• {p}', sty('li',fontSize=9,leading=13,leftIndent=8)))
story.append(Paragraph('Lo que falla:', S_sub))
story.append(box(
    '<b>Purchase = 0 (crítico).</b> Cero eventos de compra en 7 días, ni por navegador ni por servidor. '
    'Causa: el pago es manual (transferencia/OXXO + comprobante por WhatsApp) y la compra real solo puede '
    'confirmarse del lado servidor, lo cual no está implementado.',
    colors.HexColor('#fde8e8'), ROJO, colors.HexColor('#7a1414')))
story.append(Spacer(1, 0.15*cm))
for p in ['<b>EMQ 6.1/10</b> — IP, user-agent y fbp al 100%, pero teléfono/nombre/email al 0% y zip 1.8%. El formulario recopila esos datos pero no se envían al pixel.',
          '<b>AddPaymentInfo con value 0</b> y pasos del embudo disparando de forma independiente.',
          'Sin reglas de conversión personalizada configuradas.']:
    story.append(Paragraph(f'• {p}', sty('li2',fontSize=9,leading=13,leftIndent=8)))
story.append(Spacer(1, 0.4*cm))

# ══════════════ SECCIÓN C ══════════════
story.append(sec_header('SECCIÓN C — Estructura de negocios y cuentas', NARANJA))
story.append(Spacer(1, 0.2*cm))
story.append(box(
    '<b>Posible desconexión pixel ↔ cuenta:</b> el pixel pertenece al negocio 923228882183608, '
    'pero las campañas corren en la cuenta Ernesto Marroquin Transfer (1942278216304903), de otro negocio '
    '(1618834588836327). Al listar los datasets del negocio del pixel devolvió 0. Hay que confirmar en '
    'Business Manager que el pixel esté compartido/asignado a la cuenta que corre las campañas.',
    colors.HexColor('#fff3dc'), NARANJA, colors.HexColor('#6b3d00')))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph('Estado de las cuentas publicitarias detectadas:', S_sub))
cta = [
    [Paragraph('<b>Cuenta</b>',sty('c0',fontSize=8.5,textColor=BLANCO)),Paragraph('<b>ID</b>',sty('c0b',fontSize=8.5,textColor=BLANCO)),Paragraph('<b>Estado</b>',sty('c0c',fontSize=8.5,textColor=BLANCO))],
    ['Ernesto Marroquin Transfer','1942278216304903','Activa (MCP deshabilitado)'],
    ['GRUPO RIOS NUEVO','465839215891114','INHABILITADA (actividad inusual)'],
    ['Taller Social','9954276864609797','Activa'],
    ['Viparmex','937548360398999','Cerrada'],
]
rows=[cta[0]]
for r in cta[1:]:
    rows.append([Paragraph(r[0],sty('q',fontSize=8.5)),Paragraph(r[1],sty('q2',fontSize=8.5)),Paragraph(r[2],sty('q3',fontSize=8.5))])
t=Table(rows,colWidths=[5.2*cm,4.5*cm,5.5*cm])
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),NARANJA),('GRID',(0,0),(-1,-1),0.4,GRIS2),
    ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),5)]))
story.append(t)
story.append(PageBreak())

# ══════════════ SECCIÓN D ══════════════
story.append(sec_header('SECCIÓN D — Dos pixeles (hallazgo mayor)', ROJO))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph('Se detectó la existencia de un segundo pixel. Escenario que explicaría todos los síntomas:', S_body))
story.append(box(
    'La WEB dispara al pixel &nbsp;<b>PIXEL NUEVO (1272564394151080)</b>.<br/>'
    'Si las CAMPAÑAS optimizan con &nbsp;<b>PIXEL NUEVO NUEVO (3662695490547642)</b>, que está vacío, '
    'entonces los eventos llegan pero al pixel equivocado → sensación de que "el pixel no registra".',
    colors.HexColor('#fde8e8'), ROJO, colors.HexColor('#7a1414')))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph('Riesgos de mantener dos pixeles: datos partidos, campañas optimizando sin conversiones reales, '
    'doble conteo si ambos disparan, y públicos de remarketing incompletos.', S_body))
story.append(Paragraph('Verificación decisiva (en Administrador de anuncios): abrir una campaña de la cuenta '
    '1942278216304903 → nivel Conjunto de anuncios → campo "Píxel / Conjunto de datos" → confirmar cuál ID aparece.', S_body))
story.append(Spacer(1, 0.4*cm))

# ══════════════ SECCIÓN E ══════════════
story.append(sec_header('SECCIÓN E — Pendiente por reconexión del conector Facebook', colors.HexColor('#555555')))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph('El conector de Facebook Meta Ads se desconectó de la sesión. Al reconectar se completará:', S_body))
for p in ['Diagnóstico en vivo del pixel 3662695490547642: volumen, embudo, navegador vs servidor, Purchase, EMQ.',
          'Comparación lado a lado 3662695490547642 vs 1272564394151080.',
          'A qué cuenta/portafolio está asignado cada pixel.',
          'Cierre de verificaciones: desglose por host/URL y dispositivo, conversiones personalizadas, extractores de parámetros.']:
    story.append(Paragraph(f'• {p}', sty('e',fontSize=9,leading=13,leftIndent=8)))
story.append(Spacer(1, 0.4*cm))

# ══════════════ PLAN DE ACCIÓN ══════════════
story.append(sec_header('PLAN DE ACCIÓN', AZULOSC))
story.append(Spacer(1, 0.2*cm))
pa = [
    [Paragraph('<b>Vía</b>',sty('p0',fontSize=8.5,textColor=BLANCO)),Paragraph('<b>Responsable</b>',sty('p0b',fontSize=8.5,textColor=BLANCO)),Paragraph('<b>Acción</b>',sty('p0c',fontSize=8.5,textColor=BLANCO))],
    ['A','Usuario (Business Manager)','Confirmar qué pixel usan las campañas y compartir/asignar el pixel correcto a la cuenta 1942278216304903. PRIORIDAD.'],
    ['B','Desarrollador','Implementar Purchase por Conversions API al confirmar el pago + Advanced Matching (teléfono/nombre hasheados) para subir el EMQ.'],
    ['C','Nosotros','Al reconectar Facebook, correr la Sección E y actualizar esta auditoría.'],
]
rows=[pa[0]]
for r in pa[1:]:
    rows.append([Paragraph(r[0],sty('r',fontSize=9,fontName='Helvetica-Bold',alignment=TA_CENTER)),Paragraph(r[1],sty('r2',fontSize=8.5)),Paragraph(r[2],sty('r3',fontSize=8.5))])
t=Table(rows,colWidths=[1.2*cm,4*cm,10*cm])
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),AZULOSC),('GRID',(0,0),(-1,-1),0.4,GRIS2),
    ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),5),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('BACKGROUND',(0,1),(-1,-1),colors.HexColor('#f5f8fc'))]))
story.append(t)
story.append(Spacer(1, 0.5*cm))
story.append(box(
    '<b>Prioridad #1:</b> confirmar con cuál pixel optimizan las campañas. Si es PIXEL NUEVO NUEVO '
    '(3662695490547642), esa es la causa raíz y se corrige apuntando las campañas al pixel que la web '
    'dispara (1272564394151080) o unificando en un solo pixel.',
    colors.HexColor('#e6f0fa'), AZUL, colors.HexColor('#1c3d5c')))

doc.build(story, onFirstPage=_pg, onLaterPages=_pg)
print('Auditoría generada.')
