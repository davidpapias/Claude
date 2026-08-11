from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import datetime

W, H = A4
AZUL   = colors.HexColor('#2c70ba')
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

def build_doc(path, title):
    return SimpleDocTemplate(path, pagesize=A4, rightMargin=1.8*cm, leftMargin=1.8*cm,
                             topMargin=2*cm, bottomMargin=1.8*cm, title=title)

def banner(text, sub):
    story = []
    story.append(Spacer(1, 0.4*cm))
    story.append(Table([[Paragraph(text, sty('bt',fontSize=17,textColor=BLANCO,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
        colWidths=[W-3.6*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),AZUL),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),14)])))
    story.append(Spacer(1, 0.15*cm))
    story.append(Table([[Paragraph(sub, sty('bs',fontSize=11,textColor=AZUL,fontName='Helvetica-Bold',alignment=TA_CENTER))]],
        colWidths=[W-3.6*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#e8f0fa')),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)])))
    story.append(Spacer(1, 0.5*cm))
    return story

def sec_header(text, color):
    return Table([[Paragraph(f'  {text}', sty('sh',fontSize=10.5,textColor=BLANCO,fontName='Helvetica-Bold'))]],
        colWidths=[W-3.6*cm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('TOPPADDING',(0,0),(-1,-1),5),
                          ('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),6)]))

S_body = sty('body', fontSize=10, leading=15, spaceAfter=5)
S_sub  = sty('sub',  fontSize=9.5, textColor=AZUL, fontName='Helvetica-Bold', spaceBefore=6, spaceAfter=2)

# ══════════════════════════════════════════════════════════════════════════════
# PDF 1 — RESUMEN EJECUTIVO (teaser, sin problema ni solucion)
# ══════════════════════════════════════════════════════════════════════════════
doc1 = build_doc('/home/user/Claude/resumen_ejecutivo_pixel.pdf', 'Resumen Ejecutivo - Meta Pixel')
s = banner('RESUMEN EJECUTIVO', 'Meta Pixel — eventosptovallartatransfer.com')

s.append(Paragraph(
    f'Revisión general del estado del píxel de seguimiento y su impacto en la medición '
    f'de las campañas publicitarias. Fecha: {HOY}.', S_body))
s.append(Spacer(1, 0.3*cm))
s.append(Paragraph('Hallazgos generales', sty('h',fontSize=13,textColor=AZUL,fontName='Helvetica-Bold',spaceAfter=6)))
s.append(HRFlowable(width='100%', thickness=1, color=AZUL))
s.append(Spacer(1, 0.3*cm))

puntos = [
    ('El píxel está activo y recibiendo tráfico',
     'pero no todas las señales del proceso de compra se están registrando como deberían.'),
    ('La calidad de la información que recibe Facebook',
     'está por debajo del estándar recomendado para una medición óptima.'),
    ('La identificación de los usuarios que interactúan',
     'está dejando datos valiosos sin aprovechar.'),
    ('La medición de resultados de las campañas no está completa',
     'lo que limita la capacidad de optimización automática.'),
    ('Existen detalles de configuración por ajustar',
     'que pueden mejorar el rendimiento de la inversión publicitaria.'),
]
rows = []
for i,(t,d) in enumerate(puntos, 1):
    rows.append([
        Paragraph(f'<b>{i}</b>', sty(f'n{i}',fontSize=13,textColor=BLANCO,alignment=TA_CENTER)),
        Paragraph(f'<b>{t}.</b> {d}', sty(f'p{i}',fontSize=10.5,leading=15)),
    ])
t = Table(rows, colWidths=[1.1*cm, W-4.7*cm])
tstyle = TableStyle([
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
    ('LEFTPADDING',(1,0),(1,-1),10),
    ('LINEBELOW',(0,0),(-1,-2),0.4,GRIS2),
])
for i in range(len(puntos)):
    tstyle.add('BACKGROUND',(0,i),(0,i),AZUL)
t.setStyle(tstyle)
s.append(t)
s.append(Spacer(1, 0.8*cm))
s.append(Table([[Paragraph(
    'El detalle técnico de cada punto, así como los pasos concretos de solución, se '
    'entregan en el reporte técnico correspondiente.', sty('nota',fontSize=9.5,textColor=colors.HexColor('#5a4000'),leading=13))]],
    colWidths=[W-3.6*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#fff8dc')),
                      ('BOX',(0,0),(-1,-1),0.8,colors.HexColor('#c8a000')),
                      ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
                      ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)])))
doc1.build(s)
print('PDF 1 (ejecutivo) generado.')

# ══════════════════════════════════════════════════════════════════════════════
# PDF 2 — REPORTE DE FALLOS Y PASOS
# ══════════════════════════════════════════════════════════════════════════════
doc2 = build_doc('/home/user/Claude/reporte_fallos_pixel.pdf', 'Reporte de Fallos - Meta Pixel')
s = banner('REPORTE DE FALLOS Y PASOS', 'Meta Pixel — eventosptovallartatransfer.com')

s.append(Paragraph(
    f'Detalle técnico verificado con la API de Meta Ads. Pixel 1272564394151080 '
    f'("PIXEL NUEVO"). Ventana analizada: 28/jun – 05/jul. Fecha: {HOY}.', S_body))
s.append(Spacer(1, 0.2*cm))

# Estado general
s.append(Table([[Paragraph(
    '<b>Estado general:</b> Pixel ACTIVO · embudo parcial llegando · integración de servidor '
    '(CAPI) propia ya operando con deduplicación navegador/servidor. Los arreglos previos de la web funcionaron.',
    sty('eg',fontSize=9.5,textColor=colors.HexColor('#14521a'),leading=13))]],
    colWidths=[W-3.6*cm],
    style=TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#edf7ed')),
                      ('BOX',(0,0),(-1,-1),0.8,VERDE),
                      ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
                      ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)])))
s.append(Spacer(1, 0.4*cm))

def fallo(num, titulo, color, evidencia, causa, impacto, pasos):
    block = [sec_header(f'{num} — {titulo}', color), Spacer(1, 0.2*cm)]
    block.append(Paragraph('Evidencia:', S_sub))
    block.append(Paragraph(evidencia, S_body))
    if causa:
        block.append(Paragraph('Causa:', S_sub))
        block.append(Paragraph(causa, S_body))
    if impacto:
        block.append(Paragraph('Impacto:', S_sub))
        block.append(Paragraph(impacto, S_body))
    block.append(Paragraph('Pasos para solucionar:', S_sub))
    for i,p in enumerate(pasos,1):
        block.append(Paragraph(f'{i}. {p}', sty(f'paso',fontSize=10,leading=14,leftIndent=8,spaceAfter=2)))
    block.append(Spacer(1, 0.35*cm))
    return block

s += fallo('FALLO 1 (CRÍTICO)', 'El evento de compra (Purchase) nunca se registra', ROJO,
    'Cero eventos <b>Purchase</b> en 7 días, ni por navegador ni por servidor (consulta específica devolvió vacío).',
    'El pago es manual (transferencia / OXXO + comprobante por WhatsApp); la compra real solo puede confirmarse del lado servidor, y eso no está implementado.',
    'Las campañas con objetivo de compra no tienen ninguna conversión que optimizar; sin ROAS real.',
    ['En el sistema, marcar el punto donde se confirma manualmente un pago.',
     'Desde ese punto, enviar Purchase por Conversions API (el canal de servidor ya existe, solo falta extender el evento).',
     'Incluir value real, currency=MXN, num_items, contents[] con el ID de sorteo dinámico y un event_id estable para deduplicar.'])

s += fallo('FALLO 2 (ALTO)', 'Calidad de coincidencia baja (EMQ 6.1 / 10)', NARANJA,
    'EMQ 6.1 en todos los eventos. Cobertura: IP 100%, user-agent 100%, fbp 100% — pero teléfono, nombre y email al 0%, y zip solo 1.8%.',
    'El formulario recopila nombre, apellido, teléfono y estado, pero esos datos no se envían al pixel (ni Advanced Matching en navegador, ni user_data hasheado en servidor).',
    'Menor atribución y audiencias más pobres. Con los datos, el EMQ subiría a 8+.',
    ['Navegador: enviar Advanced Matching con los datos del formulario (Meta los hashea automáticamente).',
     'Servidor: incluir user_data con teléfono y nombre en SHA-256 en los eventos de CAPI.'])

s += fallo('FALLO 3 (ALTO)', 'Pasos del embudo disparan sueltos y con valor 0', NARANJA,
    'AddPaymentInfo a veces supera a InitiateCheckout y en horas sin él; el evento va con value: 0.',
    'Los usuarios entran directo a /pagos; el evento no lleva valor ni contenido.',
    'Señal de bajo valor y embudo inconsistente.',
    ['Adjuntar value / contents a AddPaymentInfo cuando exista contexto del sorteo.',
     'Confirmar el orden esperado: ViewContent → InitiateCheckout → AddPaymentInfo → Purchase.'])

s += fallo('FALLO 4 (MEDIO)', 'Atribución de clics diluida (fbc 3–4%)', AMBAR,
    'Cobertura del identificador de clic (fbc) muy baja: 3–4%.',
    'Relacionada con la mezcla de dominio www / non-www ya señalada en el reporte web.',
    'Menor atribución de conversiones a los clics de anuncios.',
    ['Unificar el dominio con redirección 301 (www o non-www) y enlaces internos a un solo host.'])

# Pendientes
s.append(sec_header('PENDIENTE DE VERIFICAR (requirió aprobación no disponible en la sesión)', colors.HexColor('#555555')))
s.append(Spacer(1, 0.2*cm))
for p in ['Desglose de eventos por URL/host y por dispositivo.',
          'Cuentas publicitarias y a qué evento están optimizando las campañas.',
          'Conversiones personalizadas configuradas en la cuenta.',
          'Pixeles duplicados dentro del negocio.',
          'Extractores de parámetros del pixel.']:
    s.append(Paragraph(f'• {p}', sty('pend',fontSize=9.5,leading=13,leftIndent=8)))

doc2.build(s)
print('PDF 2 (fallos) generado.')
