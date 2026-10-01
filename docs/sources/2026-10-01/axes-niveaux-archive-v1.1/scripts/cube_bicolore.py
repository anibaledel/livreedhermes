"""Fermeture sur le cube des 4096 figures de parite a la maille C1.

Regle d'arete avec pi = identite : deux cases adjacentes par une arete du cube
portent la meme teinte. Habillage = un element de D4 par face (8^6 possibles),
resolu par recherche avec propagation et non par enumeration.
"""
import json, math, itertools
from collections import defaultdict
from regle_parite import cle, u_de

N=12
FAC=['top','bottom','front','back','left','right']
FACES={'top':((0,0,12),(1,0,0),(0,1,0)),'bottom':((0,0,0),(1,0,0),(0,1,0)),
       'front':((0,0,12),(1,0,0),(0,0,-1)),'back':((0,12,12),(1,0,0),(0,0,-1)),
       'left':((0,0,12),(0,1,0),(0,0,-1)),'right':((12,0,12),(0,1,0),(0,0,-1))}
def som(f,r,c):
    O,ec,er=FACES[f]; P=lambda i,j: tuple(O[k]+ec[k]*i+er[k]*j for k in range(3))
    return [P(c,r),P(c+1,r),P(c+1,r+1),P(c,r+1)]
def aretes():
    seg=defaultdict(list)
    for f in FAC:
        for r in range(N):
            for c in range(N):
                v=som(f,r,c)
                for i in range(4): seg[frozenset((v[i],v[(i+1)%4]))].append((f,r,c))
    par=defaultdict(list)
    for cells in seg.values():
        if len(cells)==2 and cells[0][0]!=cells[1][0]:
            (f1,r1,c1),(f2,r2,c2)=cells
            i,j=FAC.index(f1),FAC.index(f2)
            if i<j: par[(i,j)].append(((r1,c1),(r2,c2)))
            else:   par[(j,i)].append(((r2,c2),(r1,c1)))
    return sorted(par.items())
ARETES=aretes()
def quart(g): return [[g[N-1-c][r] for c in range(N)] for r in range(N)]
def miro(g):  return [row[::-1] for row in g]
def d4(g):
    out=[]; x=g
    for _ in range(4): out.append(x); x=quart(x)
    y=miro(g)
    for _ in range(4): out.append(y); y=quart(y)
    return out
def ferme(g):
    R=d4(g)
    adm={}
    for (i,j),cells in ARETES:
        S=[(k1,k2) for k1 in range(8) for k2 in range(8)
           if all(R[k2][r2][c2]==R[k1][r1][c1] for (r1,c1),(r2,c2) in cells)]
        if not S: return False
        adm[(i,j)]=set(S)
    ks=[None]*6
    def bt(d):
        if d==6: return True
        for k in range(8):
            ks[d]=k
            if all((ks[i],ks[j]) in adm[(i,j)] for (i,j) in adm
                   if ks[i] is not None and ks[j] is not None): 
                if bt(d+1): return True
            ks[d]=None
        return False
    return bt(0)

fam=json.load(open('catalogue-axes.json'))['familles']; names=list(fam)
C1=[(x+.5,y+.5) for y in range(12) for x in range(12)]
def famfig(n):
    S={cle(a['nature'],a['ecart']) for a in fam[n]}
    v=0
    for i,(x,y) in enumerate(C1):
        b=0
        for nat,c in S: b^=int(math.floor((u_de(nat,x,y)-c)/12.))&1
        if b: v|=1<<i
    return v
gen=[famfig(n) for n in names]
best={}
for m in range(1,1<<16):
    s=bin(m).count('1'); v=0; mm=m; i=0
    while mm:
        if mm&1: v^=gen[i]
        mm>>=1; i+=1
    if v not in best or s<best[v]: best[v]=s
best.setdefault(0,0)
print('figures distinctes C1 :',len(best))
def grid(v): return [[(v>>(y*12+x))&1 for x in range(12)] for y in range(12)]
clos=[v for v in best if ferme(grid(v))]
print('fermees sur le cube :',len(clos))
triv=[v for v in clos if v==0 or v==(1<<144)-1]
print('dont triviales (unie) :',len(triv),'-> non triviales :',len(clos)-len(triv))
from collections import Counter
print('ventilation par taille d accord minimale :')
cnt=Counter(best[v] for v in clos)
for k in sorted(cnt): print(f'   taille {k} : {cnt[k]}')
print('total :',sum(cnt.values()))
cntn=Counter(best[v] for v in clos if v not in triv)
print('idem, non triviales :', dict(sorted(cntn.items())))
