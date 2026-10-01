#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""fig_v2.py — figure of the second diagonal cut: (a) the twelve elements on the square,
coloured by level, YA solid and AY dashed; (b) the doubling tree on the seven levels,
with the V2 generator of each node and the first-cut family that holds it."""
import json, os, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
HERE = os.path.dirname(os.path.abspath(__file__))
V2 = json.load(open(os.path.join(HERE, 'axes-v2.json')))['elements']
LEV = {'YA1':150,'YA2':120,'YA3':90,'YA4':60,'YA5':30,'YA6':0,'AY1':30,'AY2':60,'AY3':90,'AY4':120,'AY5':150,'AY6':180}
COL = {0:'#1b2a5e',30:'#2f6db5',60:'#2a9d8f',90:'#6a994e',120:'#c98a12',150:'#c0492b',180:'#7a1f2b'}
plt.rcParams.update({'font.family':'DejaVu Serif','font.size':9})
fig = plt.figure(figsize=(9.2, 4.3))
ax = fig.add_axes([0.02, 0.06, 0.40, 0.86])
for n, segs in V2.items():
    for x1, y1, x2, y2 in segs:
        ax.plot([x1, x2], [y1, y2], color=COL[LEV[n]], lw=1.6 if n.startswith('YA') else 1.6,
                ls='-' if n.startswith('YA') else (0, (2.2, 1.4)), solid_capstyle='butt')
ax.plot([0,12,12,0,0],[0,0,12,12,0],color='#222',lw=0.8)
ax.set_xlim(-0.2,12.2); ax.set_ylim(-0.2,12.2); ax.set_aspect('equal'); ax.axis('off')
ax.set_title('(a) the twelve elements, by level\nYA solid, AY dashed', fontsize=9)
bx = fig.add_axes([0.45, 0.02, 0.54, 0.92]); bx.axis('off'); bx.set_xlim(0, 10); bx.set_ylim(0, 10)
bx.set_title('(b) the doubling tree $\\theta \\mapsto 2\\theta$ on the seven levels', fontsize=9)
nodes = {0:(2.3,1.3), 180:(2.3,4.4), 90:(2.3,7.5),
         120:(7.3,1.3), 60:(7.3,4.4), 30:(5.9,7.5), 150:(8.7,7.5)}
lab = {0:('YA6','T$_0$ YANG'),180:('AY6','T$_0$ YANG MUT'),90:('YA3 ≡ AY3','T$_1$ YANG MUT'),
       120:('YA2 ≡ AY4','T$_2$ YANG'),60:('YA4 ≡ AY2','T$_2$ YANG'),30:('YA5 ≡ AY1','T$_2$ YANG MUT'),150:('YA1 ≡ AY5','T$_2$ YANG MUT')}
for t,(x,y) in nodes.items():
    fixed = t in (0,120)
    bx.add_patch(FancyBboxPatch((x-1.15,y-0.8),2.3,1.6,boxstyle='round,pad=0.02',fc='white',ec=COL[t],lw=2.6 if fixed else 1.4))
    bx.text(x,y+0.38,f'{t}°',ha='center',va='center',fontsize=10,color=COL[t],weight='bold')
    bx.text(x,y-0.05,lab[t][0],ha='center',va='center',fontsize=8)
    bx.text(x,y-0.45,lab[t][1],ha='center',va='center',fontsize=7,color='#666')
def arrow(a,b):
    (x1,y1),(x2,y2)=nodes[a],nodes[b]
    bx.annotate('',xy=(x2,y2+0.82),xytext=(x1,y1-0.82),arrowprops=dict(arrowstyle='->',color='#444',lw=1))
for a,b in ((180,0),(90,180),(60,120),(30,60),(150,60)): arrow(a,b)
bx.text(2.3,9.15,'tower A — resolved node by node',ha='center',fontsize=8)
bx.text(7.3,9.15,'tower B — first cut fuses the pairs',ha='center',fontsize=8)
for t in (0,120):
    x,y=nodes[t]; bx.annotate('', xy=(x+1.18,y-0.15), xytext=(x+1.18,y+0.25),
        arrowprops=dict(arrowstyle='->',connectionstyle='arc3,rad=-2.2',color='#444',lw=1))
bx.text(5.0,0.15,'thick border: fixed level; ≡: same band systems; grey: first-cut family holding the node',ha='center',fontsize=7,color='#555')
for ext in ('svg','png'):
    fig.savefig(os.path.join(HERE, f'fig-v2.{ext}'), dpi=200 if ext=='png' else None)
