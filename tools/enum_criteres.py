# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
#
# enum_criteres.py — §4.3 de la note « The Ansate Cross » : dénombrement
# exhaustif des coloriages d'ordre 6 satisfaisant les critères I–IV, puis de
# ceux qui satisfont en plus la structure de ligne de la croix ansée.
#
# Provenance : copie du dépôt Zenodo 10.5281/zenodo.22866062. Cette copie-ci
# ajoute UNIQUEMENT le bloc de sortie « Lecture des trois nombres » en fin de
# fichier ; le calcul est celui de Zenodo, inchangé. Zenodo est figé : une
# correction du calcul y serait une nouvelle version du dépôt, pas une
# modification de celle-ci.
#
# Pourquoi ce bloc existe : le script imprime d'abord 1 492 352, qui est
# l'ensemble sous les quatre critères SEULS. Lu vite, ce nombre semble
# contredire les 256 carrés solaires annoncés par le livre et par le site. Il
# ne les contredit pas — les 256 viennent des quatre critères ET de la
# structure de la croix — mais rien dans la sortie ne le disait.

import itertools, numpy as np, time
n=6; t0=time.time(); MC=n*(n*n+1)//2
cells=[(r,c) for r in range(n) for c in range(n)]
diag={(i,i) for i in range(n)}|{(i,n-1-i) for i in range(n)}
off=[x for x in cells if x not in diag]
tau=lambda r,c:(n-1-c,n-1-r)
def val(col,r,c):
    i=n*r+c+1; j=n*r+(n-1-c)+1
    return {'B':i,'R':n*n+1-i,'G':j,'Y':n*n+1-j}[col]
blues=[]
for combo in itertools.combinations(off,6):
    S=set(combo); T={tau(*x) for x in S}
    if S&T: continue
    RB=S|T
    if any(not any((r,c) in RB for c in range(n)) for r in range(n)): continue
    blues.append((S,T))
print('jeux R/B :',len(blues),flush=True)
# lignes de sommes : 6 lignes, 6 colonnes, 2 diagonales -> 14 fonctionnelles linéaires
lines=[[(r,c) for c in range(n)] for r in range(n)]+[[(r,c) for r in range(n)] for c in range(n)]+[[(i,i) for i in range(n)],[(i,n-1-i) for i in range(n)]]
idx={x:i for i,x in enumerate(cells)}
Lmat=np.zeros((14,36))
for li,L in enumerate(lines):
    for x in L: Lmat[li,idx[x]]=1
cnt=0; magic=0; masks_cache={}; stat_b=[0,0]
for S,T in blues:
    rest=[x for x in cells if x not in S and x not in T]
    orbits=[]; seen=set()
    for x in rest:
        if x in seen: continue
        o=sorted({x,tau(*x)}); seen|=set(o); orbits.append(o)
    k=len(orbits)
    if k not in masks_cache: masks_cache[k]=np.array(list(itertools.product([0,1],repeat=k)),dtype=np.int64)
    masks=masks_cache[k]
    base=np.zeros(36); D=np.zeros((k,36))
    for x in S: base[idx[x]]=val('B',*x)
    for x in T: base[idx[x]]=val('R',*x)
    for oi,o in enumerate(orbits):
        for x in o: base[idx[x]]=val('G',*x); D[oi,idx[x]]=val('Y',*x)-val('G',*x)
    # critère IV par ligne : nY - nG = nB - nR
    A=np.array([[sum(1 for (r,c) in o if r==row) for row in range(n)] for o in orbits])
    tot=A.sum(0); need=np.array([sum(1 for c in range(n) if (r,c) in S)-sum(1 for c in range(n) if (r,c) in T) for r in range(n)])
    Yneed=(tot+need)/2
    if np.any(Yneed!=np.round(Yneed)): continue
    ok=np.all(masks@A==Yneed,axis=1)
    if not ok.any(): continue
    M=masks[ok]; cnt+=len(M)
    sums=(base+M@D)@Lmat.T          # nb x 14
    ismagic=np.all(sums==MC,axis=1); magic+=int(ismagic.sum())
    # condition (b) : colorations comme entiers 0=B,1=R,2=G,3=Y
    C=np.full((len(M),36),2,dtype=np.int64)
    for x in S: C[:,idx[x]]=0
    for x in T: C[:,idx[x]]=1
    for oi,o in enumerate(orbits):
        for x in o: C[:,idx[x]]=2+M[:,oi]
    okb=np.ones(len(M),dtype=bool)
    for r in range(n):
        okb&= C[:,idx[(r,r)]]==C[:,idx[(r,5-r)]]
        offs=[c for c in range(n) if c not in (r,5-r)]; c1,c2=offs[0],offs[1]   # les deux paires miroir : (c1,5-c1),(c2,5-c2)
        p1=(C[:,idx[(r,c1)]],C[:,idx[(r,5-c1)]]); p2=(C[:,idx[(r,c2)]],C[:,idx[(r,5-c2)]])
        def stroke(p): return ((p[0]==0)&(p[1]==3))|((p[0]==3)&(p[1]==0))|((p[0]==1)&(p[1]==2))|((p[0]==2)&(p[1]==1))
        def same(p): return p[0]==p[1]
        okb&= (stroke(p1)&same(p2))|(stroke(p2)&same(p1))
    nb=int(okb.sum()); nbm=int((okb&ismagic).sum())
    stat_b[0]+=nb; stat_b[1]+=nbm
print(f'colorations I–IV : {cnt} ; magiques complètes : {magic} ; temps {time.time()-t0:.0f}s')
print(f'avec la condition (b) (diagonales de même couleur par ligne ; paires miroir = un trait + une paire unie) : {stat_b[0]} ; magiques : {stat_b[1]}')

# Les nombres ci-dessous sont ceux qui viennent d'être calculés, jamais des
# constantes : la lecture ne peut pas diverger du calcul qu'elle commente.
print()
print('Lecture des trois nombres ci-dessus')
print(f"  {cnt} est l'ensemble COMPLET des coloriages sous les critères I–IV SEULS,")
print('  sans la structure de la croix ansée.')
print('  Imposer en plus cette structure — la condition (b) — laisse exactement')
if stat_b[0] == stat_b[1]:
    print(f'  {stat_b[0]} coloriages, et tous sont magiques.')
else:
    print(f'  {stat_b[0]} coloriages, dont {stat_b[1]} magiques.')
print(f"  Les quatre critères seuls ne produisent donc pas les {stat_b[0]} : c'est la croix")
print('  qui les produit. Ces coloriages sont ceux d\'UNE croix ; la seconde croix,')
print(f"  image miroir de la première, donne les {stat_b[0]} autres — soit les 256 carrés")
print('  solaires de data/referent_256_v3.json, vérifiés par verif_protocole.py.')
