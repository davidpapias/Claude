"""Integridad del hub: enlaces vivos, cobertura y ausencia de callejones."""
import os, re, sys, glob
HERE = "/home/user/Claude/fractional-travel"
pages = sorted(os.path.basename(p) for p in glob.glob(os.path.join(HERE, "*.html")))
existing = set(pages)
href = re.compile(r'href="([^"#?][^"]*)"')
body_of = {}
fail = []

for p in pages:
    html = open(os.path.join(HERE, p), encoding="utf-8").read()
    body_of[p] = html
    for h in set(href.findall(html)):
        if h.startswith(("http://", "https://", "mailto:", "tel:", "//")):
            continue
        target = h.split("#")[0].split("?")[0]
        if target and not os.path.exists(os.path.join(HERE, target)):
            fail.append("ENLACE ROTO  %-22s -> %s" % (p, target))

# --- cobertura: ¿a cuántas llega el home? ---
home = body_of["index.html"]
desde_home = {t for t in (h.split("#")[0].split("?")[0] for h in href.findall(home))
              if t in existing}
faltan = existing - desde_home - {"index.html"}
if faltan:
    fail.append("NO ALCANZABLES DESDE EL HOME: " + ", ".join(sorted(faltan)))

# --- callejones sin salida: páginas cuyo cuerpo no enlaza a ninguna otra ---
def cuerpo(html):
    """El contenido propio, sin barra superior ni pie."""
    i = html.find('<div class="page')
    j = html.find("<footer")
    return html[i:j] if i >= 0 and j > i else ""

sin_salida = []
for p in pages:
    c = cuerpo(body_of[p])
    otras = {t for t in (h.split("#")[0].split("?")[0] for h in href.findall(c))
             if t in existing and t != p}
    if not otras:
        sin_salida.append(p)
if sin_salida:
    fail.append("SIN ENLACES SALIENTES EN EL CUERPO: " + ", ".join(sin_salida))

# --- la mecánica de venta que se retiró no debe reaparecer ---
for p in pages:
    if 'class="exit"' in body_of[p]:
        fail.append("MODAL DE SALIDA todavía presente en %s" % p)
con_barra = [p for p in pages if 'class="stickybar"' in body_of[p]]
if sorted(con_barra) != ["anthus.html", "memorandum.html", "numeros.html"]:
    fail.append("BARRA FIJA en páginas inesperadas: " + ", ".join(con_barra))

print("%d páginas revisadas" % len(pages))
if fail:
    print("\n".join(fail)); sys.exit(1)
print("OK  enlaces vivos · 20/20 alcanzables desde el home · sin callejones sin salida")
