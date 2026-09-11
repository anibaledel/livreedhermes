#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
secu-box — CLI SecuBox unifiée
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Commandes :
  exchange init               Génère une identité X25519
  exchange show               Affiche clé publique + fingerprint
  exchange offer              Publie une offer (identité + éphémère) à envoyer
  exchange complete <offer>   Dérive la session depuis l'offer du correspondant

  Échange en deux temps, symétrique : chacun lance « offer », s'envoie le
  bloc affiché, puis lance « complete » avec celui reçu. « complete » affiche
  le fingerprint annoncé par l'offer : le confronter au fingerprint que le
  correspondant vous a donné par un autre canal — c'est cette vérification,
  et elle seule, qui distingue votre correspondant d'un relais.
  send <message>              Encode + chiffre → grille CSV (session courante)
  receive <grille.csv>        Décode depuis une grille CSV
  vault init <fichier.sbvault>     Crée un vault vide
  vault add  <vault> <fichier>     Ajoute un fichier
  vault list <vault>               Liste le contenu
  vault get  <vault> <nom>         Extrait un fichier
  vault rm   <vault> <nom>         Supprime une entrée
  vault verify <vault>             Vérifie l'intégrité
  verify <grille.csv> <clés.json>  Vérifie une grille stégano
"""

import argparse, sys, os, json, getpass
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stegano_lib  import load_referents, encode, decode, grid_to_csv, csv_to_grid
from secu_box     import Identity, Session
from vault_lib    import Vault

# ── Fichiers de configuration locaux ─────────────────────────────────────────
CONFIG_DIR  = os.path.expanduser('~/.secubox')
IDENTITY_FILE = os.path.join(CONFIG_DIR, 'identity.enc')
SESSION_FILE  = os.path.join(CONFIG_DIR, 'session.json')
PENDING_FILE  = os.path.join(CONFIG_DIR, 'pending.bin')

def _ensure_config():
    os.makedirs(CONFIG_DIR, mode=0o700, exist_ok=True)

def _load_identity() -> Identity:
    if not os.path.exists(IDENTITY_FILE):
        print("Aucune identité. Lancer : secu-box exchange init", file=sys.stderr)
        sys.exit(1)
    pp = getpass.getpass("Passphrase identité : ")
    with open(IDENTITY_FILE, 'rb') as f:
        return Identity.from_export(f.read(), pp)

def _load_session() -> dict:
    if not os.path.exists(SESSION_FILE):
        print("Aucune session active. Lancer : secu-box exchange offer",
              file=sys.stderr)
        sys.exit(1)
    with open(SESSION_FILE) as f:
        return json.load(f)

def _vault_key() -> bytes:
    """
    Clé maître du vault, depuis la passphrase.

    Fix N2 (audit) : cette fonction appelait passphrase_to_key(pp,
    b'SecuBox-Vault-KDF-v1') — un sel FIXE, identique pour tout vault sur
    toute machine, et le sel aléatoire que la fonction aurait généré était
    jeté (`key, _ = ...`). Un attaquant pouvait précalculer un dictionnaire
    passphrase -> clé pour ce sel unique et le rejouer contre n'importe quel
    vault, amortissant le cout des 300 000 iterations PBKDF2 sur l'ensemble
    des vaults au lieu de le repayer pour chacun.

    Vault.create()/Vault.open() dans vault_lib.py derivent deja
    correctement un sel aleatoire PAR VAULT (os.urandom(SALT_SIZE), stocke
    dans l'en-tete, relu a l'ouverture) et l'appliquent via Argon2id
    (_key_material/_argon2id) — exactement comme _argon2id_identity() dans
    secu_box.py passe deja la passphrase directement a Argon2id sans
    pre-hachage a sel fixe. La double derivation ici etait non seulement
    a sel fixe mais redondante : la passphrase est desormais transmise
    telle quelle, et c'est le sel par vault de vault_lib.py qui fait tout
    le travail de derivation.
    """
    pp = getpass.getpass("Passphrase vault : ")
    pp2 = getpass.getpass("Confirmer (laisser vide si ouverture) : ")
    if pp2 and pp != pp2:
        print("Passphrases différentes.", file=sys.stderr)
        sys.exit(1)
    return pp.encode('utf-8')

# ── Commandes ─────────────────────────────────────────────────────────────────
def cmd_exchange_init(args):
    _ensure_config()
    if os.path.exists(IDENTITY_FILE) and not args.force:
        print("Une identité existe déjà. Utiliser --force pour écraser.")
        sys.exit(1)
    pp = getpass.getpass("Nouvelle passphrase pour l'identité : ")
    pp2 = getpass.getpass("Confirmer : ")
    if pp != pp2:
        print("Passphrases différentes.", file=sys.stderr); sys.exit(1)
    identity = Identity()
    with open(IDENTITY_FILE, 'wb') as f:
        f.write(identity.export_private(pp))
    os.chmod(IDENTITY_FILE, 0o600)
    print(f"✓ Identité créée")
    print(f"  Clé publique  : {identity.public_bytes.hex()}")
    print(f"  Fingerprint   : {identity.fingerprint()}")
    print(f"  Fichier       : {IDENTITY_FILE}")
    print(f"\nCette clé publique n'est pas transmise telle quelle : elle voyage")
    print(f"dans l'offer produite par « exchange offer ». Communiquer le")
    print(f"fingerprint ci-dessus par un canal sûr.")

def cmd_exchange_show(args):
    identity = _load_identity()
    print(f"Clé publique : {identity.public_bytes.hex()}")
    print(f"Fingerprint  : {identity.fingerprint()}")
    print(f"\nDonner ce fingerprint à vos correspondants par un canal sûr :")
    print(f"« exchange complete » le leur fera confronter à celui que votre")
    print(f"offer annonce, et c'est cette confrontation qui écarte un relais.")

def cmd_exchange_offer(args):
    """Premier temps : publier identité + éphémère, garder l'éphémère privée."""
    _ensure_config()
    ref256, _ = load_referents()
    identity  = _load_identity()
    session   = Session(ref256, identity)
    with open(PENDING_FILE, 'wb') as f:
        f.write(session.export_pending())
    os.chmod(PENDING_FILE, 0o600)
    print("Votre offer — à transmettre au correspondant :\n")
    print(f"  {session.offer().hex()}\n")
    print(f"Votre fingerprint : {identity.fingerprint()}")
    print("Le lui donner par un autre canal (voix, rencontre) : c'est ce qui")
    print("lui permettra de vérifier que l'offer vient bien de vous.")
    print("\nÀ réception de la sienne : secu-box exchange complete <offer>")

def cmd_exchange_complete(args):
    """Second temps : dériver la session depuis l'offer reçue."""
    _ensure_config()
    if not os.path.exists(PENDING_FILE):
        print("Aucune offer en attente. Lancer d'abord : secu-box exchange offer",
              file=sys.stderr)
        sys.exit(1)
    ref256, _ = load_referents()
    identity  = _load_identity()

    try:
        their_offer = bytes.fromhex(args.offer.strip())
    except ValueError:
        print("Offer invalide (hexadécimal attendu)", file=sys.stderr)
        sys.exit(1)
    try:
        fingerprint = Session.peer_fingerprint(their_offer)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    print(f"L'offer annonce le fingerprint : {fingerprint}")
    if not args.yes:
        print("Confronter ce fingerprint à celui que votre correspondant vous a")
        print("donné par un autre canal. S'ils diffèrent, quelqu'un s'interpose.")
        if input("Correspond-il ? [o/N] ").strip().lower() not in ('o','oui','y','yes'):
            print("Échange interrompu — session non dérivée.", file=sys.stderr)
            sys.exit(1)

    with open(PENDING_FILE, 'rb') as f:
        pending = f.read()
    try:
        session = Session.resume(ref256, identity, pending)
    except Exception:
        print("Offer en attente illisible (identité différente ?). "
              "Relancer : secu-box exchange offer", file=sys.stderr)
        sys.exit(1)

    try:
        keys = session.derive(their_offer)
    except ValueError as e:
        print(f"Dérivation refusée : {e}", file=sys.stderr)
        sys.exit(1)

    with open(SESSION_FILE, 'w') as f:
        json.dump({k: (v.hex() if isinstance(v, bytes) else v)
                   for k, v in keys.items()}, f, indent=2)
    os.chmod(SESSION_FILE, 0o600)
    os.unlink(PENDING_FILE)          # referme la fenêtre de forward secrecy

    print(f"\n✓ Session dérivée : {keys['session_id']}")
    print(f"  Clé de session  : {keys['steg_key'].hex()[:24]}...")
    print(f"  Authentifiée    : triple DH — l'identité {fingerprint} est liée")
    print(f"                    à cette session")
    print(f"  Forward secrecy : clé éphémère détruite ✓")

def cmd_send(args):
    ref256, _ = load_referents()
    session = _load_session()
    steg_key = bytes.fromhex(session['steg_key'])
    key_b = session['key_b']
    key_c = session['key_c']
    key_2 = session['key_2']
    msg   = args.message
    grid_size = args.grid or 60
    output    = args.output or 'grille.csv'
    grid = encode(msg, steg_key, key_b, key_c, key_2, ref256, grid_size)
    with open(output, 'w') as f:
        f.write(grid_to_csv(grid))
    print(f"✓ '{msg}' encodé → {output}")
    print(f"  Grille {grid_size}×{grid_size}, session {session['session_id']}")

def cmd_receive(args):
    ref256, _ = load_referents()
    session = _load_session()
    steg_key = bytes.fromhex(session['steg_key'])
    key_b = session['key_b']
    key_c = session['key_c']
    key_2 = session['key_2']
    with open(args.grid_file) as f:
        grid = csv_to_grid(f.read())
    msg = decode(grid, steg_key, key_b, key_c, key_2, ref256)
    print(f"Message décodé : '{msg}'")

def cmd_vault_init(args):
    key = _vault_key()
    v = Vault.create(args.vault_file, key)
    v.save()
    print(f"✓ Vault créé : {args.vault_file}")

def cmd_vault_add(args):
    key = _vault_key()
    v   = Vault.open(args.vault_file, key)
    with open(args.file, 'rb') as f:
        data = f.read()
    name = os.path.basename(args.file)
    v.add(name, data)
    v.save()
    print(f"✓ '{name}' ajouté ({len(data)} bytes)")

def cmd_vault_list(args):
    key = _vault_key()
    v   = Vault.open(args.vault_file, key)
    entries = v.list()
    if not entries:
        print("Vault vide.")
        return
    print(f"{'Nom':<30} {'Taille':>8}  SHA256")
    print("─" * 60)
    for e in entries:
        print(f"{e['name']:<30} {e['size']:>8}  {e['sha256']}")
    print(f"\n{len(entries)} fichier(s)")

def cmd_vault_get(args):
    key = _vault_key()
    v   = Vault.open(args.vault_file, key)
    data = v.get(args.name)
    out  = args.output or args.name
    with open(out, 'wb') as f:
        f.write(data)
    print(f"✓ '{args.name}' extrait → {out}")

def cmd_vault_rm(args):
    key = _vault_key()
    v   = Vault.open(args.vault_file, key)
    v.remove(args.name)
    v.save()
    print(f"✓ '{args.name}' supprimé du vault")

def cmd_vault_verify(args):
    key = _vault_key()
    try:
        Vault.open(args.vault_file, key)
        print(f"✓ Vault intègre : {args.vault_file}")
    except ValueError as e:
        print(f"✗ Vault corrompu : {e}", file=sys.stderr)
        sys.exit(1)

def cmd_verify(args):
    ref256, _ = load_referents()
    session = _load_session()
    steg_key = bytes.fromhex(session['steg_key'])
    key_b = session['key_b']
    key_c = session['key_c']
    key_2 = session['key_2']
    try:
        with open(args.grid_file) as f:
            grid = csv_to_grid(f.read())
        decode(grid, steg_key, key_b, key_c, key_2, ref256)
        print(f"✓ Grille valide et authentifiée")
    except ValueError as e:
        print(f"✗ Grille invalide : {e}", file=sys.stderr)
        sys.exit(1)

# ── Parser ────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(
        prog='secu-box',
        description='SecuBox — Communication sécurisée La Livrée d\'Hermès')
    sub = p.add_subparsers(dest='cmd', required=True)

    # exchange
    ex = sub.add_parser('exchange', help='Gestion des identités et sessions')
    exsub = ex.add_subparsers(dest='excmd', required=True)
    ei = exsub.add_parser('init', help='Créer une identité')
    ei.add_argument('--force', action='store_true')
    exsub.add_parser('show', help='Afficher la clé publique')
    exsub.add_parser('offer', help='Publier une offer (identité + éphémère)')
    ec = exsub.add_parser('complete', help='Dériver la session depuis une offer reçue')
    ec.add_argument('offer', help='Offer hex (128 chars) du correspondant')
    ec.add_argument('-y','--yes', action='store_true',
                    help='Ne pas demander la confirmation du fingerprint')

    # send
    sn = sub.add_parser('send', help='Encoder un message stégano')
    sn.add_argument('message', help='Message à envoyer')
    sn.add_argument('-o','--output', help='Fichier CSV de sortie (défaut: grille.csv)')
    sn.add_argument('-g','--grid',   type=int, help='Taille grille (défaut: 60)')

    # receive
    rc = sub.add_parser('receive', help='Décoder un message stégano')
    rc.add_argument('grid_file', help='Fichier grille CSV')

    # vault
    vt = sub.add_parser('vault', help='Vault chiffré de fichiers')
    vtsub = vt.add_subparsers(dest='vtcmd', required=True)
    vi = vtsub.add_parser('init', help='Créer un vault')
    vi.add_argument('vault_file')
    va = vtsub.add_parser('add', help='Ajouter un fichier')
    va.add_argument('vault_file'); va.add_argument('file')
    vl = vtsub.add_parser('list', help='Lister le contenu')
    vl.add_argument('vault_file')
    vg = vtsub.add_parser('get', help='Extraire un fichier')
    vg.add_argument('vault_file'); vg.add_argument('name')
    vg.add_argument('-o','--output')
    vr = vtsub.add_parser('rm', help='Supprimer une entrée')
    vr.add_argument('vault_file'); vr.add_argument('name')
    vv = vtsub.add_parser('verify', help='Vérifier l\'intégrité')
    vv.add_argument('vault_file')

    # verify
    vf = sub.add_parser('verify', help='Vérifier une grille stégano')
    vf.add_argument('grid_file')

    args = p.parse_args()

    dispatch = {
        ('exchange','init')  : cmd_exchange_init,
        ('exchange','show')  : cmd_exchange_show,
        ('exchange','offer'):   cmd_exchange_offer,
        ('exchange','complete'):cmd_exchange_complete,
        ('send',    None)    : cmd_send,
        ('receive', None)    : cmd_receive,
        ('vault',   'init')  : cmd_vault_init,
        ('vault',   'add')   : cmd_vault_add,
        ('vault',   'list')  : cmd_vault_list,
        ('vault',   'get')   : cmd_vault_get,
        ('vault',   'rm')    : cmd_vault_rm,
        ('vault',   'verify'): cmd_vault_verify,
        ('verify',  None)    : cmd_verify,
    }

    subcmd = getattr(args, 'excmd', None) or getattr(args, 'vtcmd', None)
    key    = (args.cmd, subcmd)
    fn     = dispatch.get(key)
    if fn:
        fn(args)
    else:
        p.print_help()

if __name__ == '__main__':
    main()
