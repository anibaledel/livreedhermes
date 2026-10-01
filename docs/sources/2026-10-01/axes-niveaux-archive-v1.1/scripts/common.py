import json, os, itertools, numpy as np
CAT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'catalogue-axes.json')
REF=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','referent_360_v3.json') if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','referent_360_v3.json')) else os.path.join(os.path.dirname(os.path.abspath(__file__)),'referent_360_v3.json')
N=12
cat=json.load(open(CAT))
FAM={k:[(a['nature'],a['ecart']) for a in v] for k,v in cat['familles'].items()}
AXES=sorted(set(a for v in FAM.values() for a in v))
def u_of(nature,x,y):
    return {'H':y,'V':x,'D+':(x+y-12)/2,'D-':(y-x)/2}[nature]
def c_of(nature,e):   # coordinate value of the line in the same units as u
    return {'H':6+e,'V':6+e,'D+':e,'D-':e}[nature]
# C1 : cell centroids ; C8 : 8 triangle centroids per cell
def pts_C1():
    return [(r,c,(c+0.5,r+0.5)) for r in range(N) for c in range(N)]
def pts_C8():
    # triangle centroids: sectors s=0..7 clockwise from up; centroids at offsets
    offs=[]
    import math
    # triangles: each cell cut by 2 diagonals + 2 medians -> 8 right triangles with centroid at
    # (±1/6, ±1/3) and (±1/3, ±1/6) in cell units from centre
    cands=[(1/6,-1/3),(1/3,-1/6),(1/3,1/6),(1/6,1/3),(-1/6,1/3),(-1/3,1/6),(-1/3,-1/6),(-1/6,-1/3)]
    return [(r,c,(c+0.5+dx,r+0.5+dy)) for r in range(N) for c in range(N) for dx,dy in cands]
def axis_vec(axis,pts):
    n,e=axis; cc=c_of(n,e)
    return np.array([1 if u_of(n,x,y)<cc else 0 for _,_,(x,y) in pts],dtype=np.uint8)
def figure(axes,pts):
    v=np.zeros(len(pts),dtype=np.uint8)
    for a in set(axes): v^=axis_vec(a,pts)
    return v
def gf2_rank(M):
    M=M.copy()%2; r=0; rows,cols=M.shape
    for c in range(cols):
        piv=None
        for i in range(r,rows):
            if M[i,c]: piv=i;break
        if piv is None: continue
        M[[r,piv]]=M[[piv,r]]
        for i in range(rows):
            if i!=r and M[i,c]: M[i]^=M[r]
        r+=1
        if r==rows: break
    return r
def in_span(basis,v):
    return gf2_rank(np.vstack([basis,v]))==gf2_rank(basis)
def images():
    d=json.load(open(REF)); L=d['layer_of']
    imgs={}
    for c in d['calques']:
        key=(c['famille'],c['teinte']); g=imgs.setdefault(key,[[None]*N for _ in range(N)])
        for col,l in (('violet','V'),('magenta','M'),('orange','O')):
            for r,cc in c[col+'_positions']:
                assert L[r][cc]==c['niveau'], (key,c['niveau'],r,cc,L[r][cc])
                g[r][cc]=l
    for k,g in imgs.items(): assert all(x for row in g for x in row), k
    return imgs
