#!/usr/bin/env python3
"""codes_cles.py — règle canonique : systèmes de bandes (clés), dédoublonnés, parité comptée depuis la case d'angle.
Clé orthogonale : (nature, e), e ∈ (−6,6] ; clé diagonale : (nature, e mod 6 ∈ (−3,3]).
Figure d'une clé = parité du nombre de droites du système (e, e±6, …) franchies."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
def key(a):
    n,e=a
    if n in ('D+','D-'): e=((e+3)%6)-3
    return (n,e)
REF=(0.01,0.01)   # région de référence : la case d'angle à l'origine
def key_vec(k,pts):
    """parité du nombre de droites du système k séparant le centroïde de la référence"""
    n,e=k; v=np.zeros(len(pts),dtype=np.uint8)
    lines=[e] if n in 'HV' else [c for c in (e-6,e,e+6) if -6<c<6]
    for c in lines:
        cc=c_of(n,c); ur=u_of(n,*REF)
        v^=np.array([1 if (u_of(n,x,y)<cc)!=(ur<cc) else 0 for _,_,(x,y) in pts],dtype=np.uint8)
    return v
names=list(FAM.keys())
FAMK={k:sorted(set(key(a) for a in v)) for k,v in FAM.items()}
KEYS=sorted(set(k for v in FAMK.values() for k in v))
def run(label,pts):
    KV={k:key_vec(k,pts) for k in KEYS}
    rK=gf2_rank(np.array([KV[k] for k in KEYS]))
    zero=[k for k in KEYS if KV[k].sum()==0]
    famv=[np.bitwise_xor.reduce([KV[k] for k in FAMK[n]]) for n in names]
    rF=gf2_rank(np.array(famv)); n=len(pts)
    fi=[int.from_bytes(np.packbits(v).tobytes(),'big') for v in famv]
    W=[0]*(1<<16)
    for m in range(1,1<<16):
        low=m&-m; W[m]=W[m^low]^fi[low.bit_length()-1]
    wts=[bin(w).count('1') for w in W]; nz=[w for w in wts[1:] if w>0]; dmin=min(nz)
    rel=[' + '.join(names[i] for i in range(16) if m>>i&1) for m in range(1,1<<16) if wts[m]==0 and bin(m).count('1')<=3]
    minw=[' + '.join(names[i] for i in range(16) if m>>i&1) for m in range(1,1<<16) if wts[m]==dmin]
    ki={k:int.from_bytes(np.packbits(KV[k]).tobytes(),'big') for k in KEYS}
    full=(1<<n)-1; seen=set()
    for m in range(1,1<<16):
        ks=set()
        for i in range(16):
            if m>>i&1: ks|=set(FAMK[names[i]])
        v=0
        for k in ks: v^=ki[k]
        seen.add(v)
    rD=gf2_rank(np.array([famv[i] for i,nm in enumerate(names) if 'YANG' in nm]))
    rY=gf2_rank(np.array([famv[i] for i,nm in enumerate(names) if 'YIN' in nm]))
    print(f"== {label}: rang des 8 familles diagonales {rD}, des 8 orthogonales {rY}")
    print(f"== {label}: clés {len(KEYS)}, rang {rK}, clés nulles {zero}; rang familles {rF}; d_min {dmin}; mots de poids min {minw}; relations courtes {rel}; figures distinctes (réunion de clés) {len(seen)}, dont vide : {0 in seen}")
if __name__ == '__main__':
    run('C8',pts_C8()); run('C1',pts_C1())
