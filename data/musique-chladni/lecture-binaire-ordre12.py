import numpy as np
# Port de assets/lecture-binaire.js : renvoie (R,C,4) bits [N,E,S,O] ou None si indéfini (garde-fou)
# classes : 0=V (bit1), 1=M (bit0), 2=J (jaune)
def lecture(g):
    n=g.shape[0]; out=np.zeros((n,n,4),np.uint8); bad=0
    cl=lambda r,c:int(g[r%n,c%n])
    for r in range(n):
        for c in range(n):
            k=cl(r,c)
            if k<2: out[r,c,:]=1 if k==0 else 0; continue
            v4=[cl(r-1,c),cl(r,c+1),cl(r+1,c),cl(r,c-1)]
            if all(x==2 for x in v4):
                v8=[cl(r-1,c-1),cl(r-1,c+1),cl(r+1,c-1),cl(r+1,c+1)]
                bV=0 in v8; bM=1 in v8
                if bV==bM: return None,1
                out[r,c,:]=1 if bV else 0; continue
            t=[None if x==2 else (1 if x==0 else 0) for x in v4]; tri=[]
            for i,b in enumerate(t):
                if b is not None: tri.append(b); continue
                vs=[x for x in (t[(i+3)%4],t[(i+1)%4]) if x is not None]
                if len(vs)!=1: return None,1
                tri.append(vs[0])
            out[r,c,:]=tri
    return out,0
