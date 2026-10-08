"""Mô phỏng headless bộ luật v2 của game CLB báo chí.

Chạy:  python sim_v2.py            -> bảng so sánh 6 chiến thuật (400 seed mỗi chiến thuật)
       python sim_v2.py --seeds 100 -> ít seed hơn cho nhanh

Mọi tham số nằm trong PRM. Đổi số rồi chạy lại để xem chiến thuật nào thắng.
"""
import random
import statistics as st
import sys
from collections import defaultdict

NEED = {"Ảnh": "ANH", "Tài liệu": "TL", "Gan dạ": "GD", "Hiểu chuyện": "HC"}

# Chỉ số nhân vật (đặt tạm, thang 1-10)
CHARS = {
    "Khuê": dict(PV=7, ANH=4, TL=5, GD=6, HC=5),
    "Vân": dict(PV=4, ANH=3, TL=7, GD=6, HC=6),
    "Long": dict(PV=5, ANH=5, TL=3, GD=4, HC=7),
    "Nhi": dict(PV=3, ANH=2, TL=9, GD=2, HC=6),
    "NV5": dict(PV=4, ANH=9, TL=3, GD=5, HC=4),
    "NV6": dict(PV=8, ANH=3, TL=4, GD=7, HC=3),
}

# 24 đề tài mẫu: (ngày xuất hiện, hấp dẫn, độ khó, energy, nhu cầu, áp lực cơ sở, mạch chính)
BASE = [
    (1, 4, 3, 2, "Hiểu chuyện", 1, False),   # S01
    (1, 6, 4, 3, "Tài liệu", 6, False),      # S02
    (1, 5, 5, 3, "Ảnh", 5, False),           # S03
    (2, 8, 7, 4, "Tài liệu", 18, True),      # S04
    (2, 5, 4, 2, "Hiểu chuyện", 1, False),   # S05
    (3, 6, 5, 3, "Ảnh", 4, False),           # S06
    (3, 7, 6, 3, "Gan dạ", 10, False),       # S07
    (4, 9, 8, 4, "Gan dạ", 26, True),        # S08
    (6, 8, 6, 3, "Hiểu chuyện", 12, True),   # S09
    (6, 4, 3, 2, "Ảnh", 1, False),           # S10
    (6, 7, 6, 3, "Hiểu chuyện", 10, False),  # S11
    (7, 5, 4, 2, "Tài liệu", 3, False),      # S12
    (7, 3, 2, 2, "Ảnh", 1, False),           # S13
    (8, 8, 7, 4, "Gan dạ", 22, True),        # S14
    (9, 6, 4, 3, "Tài liệu", 2, False),      # S15
    (9, 6, 5, 3, "Hiểu chuyện", 6, False),   # S16
    (11, 9, 8, 4, "Tài liệu", 30, True),     # S17
    (11, 6, 5, 3, "Tài liệu", 6, False),     # S18
    (11, 7, 6, 3, "Gan dạ", 12, False),      # S19
    (12, 8, 7, 4, "Hiểu chuyện", 16, True),  # S20
    (12, 9, 7, 4, "Hiểu chuyện", 22, True),  # S21
    (13, 5, 3, 2, "Ảnh", 3, False),          # S22
    (13, 6, 4, 2, "Ảnh", 1, False),          # S23
    (14, 8, 8, 4, "Tài liệu", 28, True),     # S24
]
GROUPS = [BASE[0:8], BASE[8:16], BASE[16:24]]

PRM = dict(
    # thời gian & năng lượng
    energy=4, slots=4, w=(0.80, 0.25, 0.12, 0.08),
    # mệt: hiệu suất = 1 - fat_k * mệt / 100
    fat_task=20, fat_night=10, fat_week=30, fat_k=0.5,
    # chất lượng đầu vào: Q = 1 + (N + trang bị - độ khó - q_off) / 10
    wP=0.6, wH=0.4, qcap=1.4, qfail=0.6, q_off=1.0,
    # điểm bài: maxscore * (hấp dẫn/10)^hd_exp * Q * (g_score)
    maxscore=100000, hd_exp=2.0,
    g_score=(0.85, 0.30), g_press=(0.5, 1.0), g_evid=(0.5, 1.0),
    # bằng chứng & điều kiện thắng
    evid_base=12, evid_need=200, win_R=55,
    # uy tín: trung bình trượt của (điểm số báo / 1000)
    R0=30, R_alpha=0.3, R_thin=2, R_mult=(1.0, 0.0), eq_thr=(42, 55, 68),
    # phạt Vân vắng tòa soạn
    van_pen=0.10, van_cap=0.25,
    # Huy
    sched=(3, 7), pr_decay=0.85, T=(100, 130, 160), lv_frac=(0.4, 0.8), carry=0.3, suspend_mult=0.5,
    # đội nhập hội theo tuần (đặt tạm)
    roster=tuple(CHARS),
    join={"Khuê": 1, "Vân": 1, "Long": 1, "Nhi": 3, "NV5": 5, "NV6": 7},
    # chỉ dùng cho các bản thử cũ
    R_gain=30, R_decay=8, emerg=100, lv_thr=(40, 80), vis_noise=1,
)


def base_score(hd, prm=PRM):
    return prm["maxscore"] * (hd / 10.0) ** prm["hd_exp"]


def make_subjects(rng):
    subs = []
    for w in range(1, 13):
        g = (w - 1) % 3
        for (app, hd, kho, e, need, P, main) in GROUPS[g]:
            a = app - 5 * g + 5 * (w - 1)
            hd2 = min(10, max(2, hd + rng.choice([-1, 0, 0, 1])))
            subs.append(dict(
                app=a, exp=a + 4, hd=hd2, kho=kho, e=e, need=need,
                P=P * rng.uniform(0.8, 1.2), main=main,
                vis=min(10, max(1, hd2 + rng.choice([-1, 0, 1]))),
                pvis=P * rng.uniform(0.6, 1.4),
                scouted=False, done=False))
    return subs


# ---------------------------------------------------------------- chiến thuật
def v_bal(s, E, w, Pr, prm):
    base = base_score(s["vis"], prm)
    pace = prm["evid_need"] * min(1, w / 11)
    m = 1.35 if (s["main"] and E < pace) else 1.0
    pen = 1.0
    if Pr > 60:
        pen = 1 - min(0.8, max(0, (s["pvis"] - 6) / 40))
    return base * m * pen / (s["e"] ** 0.3)


def v_greedy(s, E, w, Pr, prm):
    return base_score(s["vis"], prm)


def g_bal(Pr):
    return 0.6 if Pr < 40 else (0.4 if Pr < 70 else 0.2)


POL = {
    "Cân bằng": dict(cap=4, no_van=True, solo=False, g=g_bal, scout=True, value=v_bal, filt=lambda c, Pr: c),
    "Cân bằng (dùng Vân bất chấp)": dict(cap=4, no_van=False, solo=False, g=g_bal, scout=True, value=v_bal, filt=lambda c, Pr: c),
    "Tham điểm (gai góc 100%)": dict(cap=4, no_van=True, solo=False, g=lambda Pr: 1.0, scout=False, value=v_greedy, filt=lambda c, Pr: c),
    "Ngủ đông (1 bài/tuần)": dict(cap=1, no_van=True, solo=False, g=lambda Pr: 0.5, scout=True, value=v_bal, filt=lambda c, Pr: c),
    "Chỉ an toàn (P thấp, gai góc 0)": dict(cap=4, no_van=True, solo=False, g=lambda Pr: 0.0, scout=False, value=v_greedy,
                                           filt=lambda c, Pr: [s for s in c if s["pvis"] <= 6]),
    "Khuê cày một mình": dict(cap=4, no_van=True, solo=True, g=g_bal, scout=True, value=v_bal, filt=lambda c, Pr: c),
}
POL["Cân bằng, gai góc 80%"] = dict(cap=4, no_van=True, solo=False, g=lambda Pr: 0.8, scout=True, value=v_bal, filt=lambda c, Pr: c)
POL["Cày an toàn 5 tuần rồi bung"] = dict(base=POL["Cân bằng"], alt=POL["Chỉ an toàn (P thấp, gai góc 0)"], switch=5)


def run(pol, seed, prm=PRM):
    rng = random.Random(seed)
    subs = make_subjects(rng)
    fat = {c: 0 for c in prm["roster"]}
    R = prm["R0"]
    Rmax = R
    Pr = 0.0
    E = 0.0
    diff_off = 0
    suspended = False
    wk = []
    van_tasks = 0
    low_run = 0
    disbanded = False
    papers, rs, qs, fats = [], [], [], []
    tr = []
    strikes = defaultdict(int)
    banger = 0
    thin = 0
    n_art = 0

    def H(m):
        return 1 - prm["fat_k"] * m / 100.0

    for day in range(1, 61):
        w = (day - 1) // 5 + 1
        energy = prm["energy"]
        free = set(c for c in prm["roster"] if prm["join"].get(c, 1) <= w)
        eq = sum(1 for t in prm["eq_thr"] if Rmax >= t)
        ap = pol["alt"] if (pol.get("alt") and w <= pol["switch"]) else pol.get("base", pol)
        guard = 0
        while len(wk) < ap["cap"] and guard < 12:
            guard += 1
            if ap["solo"] and "Khuê" not in free:
                break
            cands = [s for s in subs if s["app"] <= day <= s["exp"] and not s["done"]
                     and s["e"] <= energy]
            cands = ap["filt"](cands, Pr)
            if not cands or len(free) < 2:
                break
            best = max(cands, key=lambda x: ap["value"](x, E, w, Pr, prm))
            if ap["scout"] and not best["scouted"] and energy >= best["e"] + 1:
                best["scouted"] = True
                best["vis"] = best["hd"]
                best["pvis"] = best["P"]
                energy -= 1
                continue
            s = best
            nk = NEED[s["need"]]
            pool = sorted(c for c in free if not (ap["no_van"] and c == "Vân"))
            if len(pool) < 2:
                pool = sorted(free)
            if ap["solo"]:
                pv, ht = "Khuê", None
                N = prm["wP"] * CHARS[pv]["PV"] * H(fat[pv]) + prm["wH"] * CHARS[pv][nk] * 0.5 * H(fat[pv])
            else:
                bestN, pv, ht = -1, None, None
                for a in pool:
                    for b in pool:
                        if a == b:
                            continue
                        n = prm["wP"] * CHARS[a]["PV"] * H(fat[a]) + prm["wH"] * CHARS[b][nk] * H(fat[b])
                        if n > bestN:
                            bestN, pv, ht = n, a, b
                N = bestN
            N += eq
            kho = s["kho"] + diff_off
            Q = max(0.0, min(prm["qcap"], 1 + (N - kho - prm["q_off"]) / 10.0))
            g = ap["g"](Pr)
            if Q < prm["qfail"]:
                score, ev, press = 0.0, 0.0, 0.0
            else:
                score = min(prm["maxscore"], base_score(s["hd"], prm) * Q
                            * (prm["g_score"][0] + prm["g_score"][1] * g)
                            * (prm["R_mult"][0] + prm["R_mult"][1] * R / 100.0))
                ev = prm["evid_base"] * Q * (prm["g_evid"][0] + prm["g_evid"][1] * g) if s["main"] else 0.0
                press = s["P"] * (prm["g_press"][0] + prm["g_press"][1] * g)
            qs.append(Q)
            for c in (pv, ht):
                if c:
                    fat[c] = min(100, fat[c] + prm["fat_task"])
                    free.discard(c)
                    if c == "Vân":
                        van_tasks += 1
            s["done"] = True
            energy -= s["e"]
            wk.append(dict(score=score, ev=ev, press=press))
        # thăm dò thêm bằng phần energy còn dư (cho ngày sau)
        if ap["scout"] and energy >= 1:
            cands = [s for s in subs if s["app"] <= day + 1 and day <= s["exp"] and not s["done"] and not s["scouted"]]
            if cands:
                b = max(cands, key=lambda x: ap["value"](x, E, w, Pr, prm))
                b["scouted"] = True
                b["vis"] = b["hd"]
                b["pvis"] = b["P"]
        fats.append(st.mean(fat[c] for c in free | set(c for c in prm["roster"] if prm["join"].get(c, 1) <= w)))
        for c in fat:
            fat[c] = max(0, fat[c] - prm["fat_night"])
        if day % 5 == 0:
            for c in fat:
                fat[c] = max(0, fat[c] - prm["fat_week"])
            # ---- cuối tuần: ra báo
            arts = sorted(wk, key=lambda a: -a["score"])[:prm["slots"]]
            S = sum(wt * a["score"] for wt, a in zip(prm["w"], arts))
            S = min(prm["maxscore"], S * prm.get("paper_scale", 1.0))
            if van_tasks:
                S *= 1 - min(prm["van_cap"], prm["van_pen"] * van_tasks)
            if suspended:
                S *= prm["suspend_mult"]
                suspended = False
            k_real = sum(1 for a in arts if a["score"] > 0)
            if prm.get("R_alpha"):
                R = R * (1 - prm["R_alpha"]) + prm["R_alpha"] * (S / 1000.0) - prm["R_thin"] * (prm["slots"] - k_real)
            else:
                R += prm["R_gain"] * S / prm["maxscore"] - prm["R_decay"] - prm["R_thin"] * (prm["slots"] - k_real)
            if k_real == 0:
                R -= 5
            R = max(0.0, min(100.0, R))
            Rmax = max(Rmax, R)
            Pr *= prm["pr_decay"]
            for a in wk:
                E += a["ev"]
                Pr += a["press"]
            n_art += len(wk)
            thin += 1 if k_real < 3 else 0
            papers.append(S)
            banger += 1 if S >= 90000 else 0
            rs.append(R)
            # ---- Huy
            sched = w in prm["sched"]
            act = 1 if w <= 3 else (2 if w <= 7 else 3)
            T = prm["T"][act - 1]
            emerg = Pr >= T
            lv_used = None
            Pr_pre = Pr
            if sched or emerg:
                lv = 2 if emerg else (0 if Pr < prm["lv_frac"][0] * T else (1 if Pr < prm["lv_frac"][1] * T else 2))
                strikes[lv] += 1
                lv_used = lv
                if lv == 0:
                    R = max(0.0, R - 3)
                elif lv == 1:
                    R = max(0.0, R - 6)
                    diff_off = min(2, diff_off + 1)
                else:
                    R = max(0.0, R - 10)
                    diff_off = min(2, diff_off + 1)
                    suspended = True
                Pr *= prm["carry"]
            tr.append(dict(w=w, n=len(wk), S=S, R=R, E=E, Pr=Pr_pre, strike=lv_used, eq=sum(1 for t in prm["eq_thr"] if Rmax >= t)))
            wk = []
            van_tasks = 0
            low_run = low_run + 1 if R <= 0 else 0
            if low_run >= 2:
                disbanded = True
                break
    reached = (not disbanded) and E >= prm["evid_need"]
    won = reached and R >= prm["win_R"]
    return dict(win=won, good=won, bitter=reached and not won, E=E, R=R, Pr=Pr,
                paper=st.mean(papers) if papers else 0, banger=banger, thin=thin,
                art=n_art / 12.0, q=st.mean(qs) if qs else 0, fat=st.mean(fats),
                s1=strikes[1], s2=strikes[2], s0=strikes[0], disb=disbanded, weeks=len(papers), trace=tr)


def summarize(prm=PRM, seeds=400, pols=None):
    out = {}
    for name, pol in (pols or POL).items():
        rs = [run(pol, sd, prm) for sd in range(seeds)]
        m = lambda k: st.mean(r[k] for r in rs)
        out[name] = dict(win=100 * m("win"), good=100 * m("bitter"), E=m("E"), R=m("R"), paper=m("paper"),
                         banger=m("banger"), art=m("art"), q=m("q"), fat=m("fat"),
                         strikes=m("s0") + m("s1") + m("s2"), heavy=m("s2"), disb=100 * m("disb"), thin=m("thin"))
    return out


def show(res):
    hdr = f"{'Chiến thuật':34s} {'Thắng%':>6s} {'Đắng%':>5s} {'E':>6s} {'Uy tín':>6s} {'Điểm báo':>8s} {'BANGER':>6s} {'Bài/tuần':>8s} {'Q':>5s} {'Mệt TB':>6s} {'Đòn nặng':>8s} {'Giải thể%':>9s}"
    print(hdr)
    for k, v in res.items():
        print(f"{k:34s} {v['win']:6.0f} {v['good']:5.0f} {v['E']:6.0f} {v['R']:6.0f} {v['paper']:8.0f} {v['banger']:6.1f} {v['art']:8.2f} {v['q']:5.2f} {v['fat']:6.1f} {v['heavy']:8.1f} {v['disb']:9.0f}")


if __name__ == "__main__":
    n = 400
    if "--seeds" in sys.argv:
        n = int(sys.argv[sys.argv.index("--seeds") + 1])
    show(summarize(PRM, n))