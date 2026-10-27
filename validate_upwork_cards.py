import json

projects = [
    {
        "id": "catering",
        "name": "Catering & Event Commerce Platform",
        "title": "Catering & Event Commerce Platform (Next.js 14, Django REST)",
        "role": "Full-Stack Engineer & System Architect",
        "desc": (
            "Goal: Build an event catering web platform with instant quote calculation and real-time order processing.\n\n"
            "Solution: Engineered a high-performance Next.js 14 SSR frontend with ISR cache revalidation, backed by Django 5 REST and PostgreSQL. Built automated Telegram bot dispatchers delivering real-time lead alerts with inline status updates.\n\n"
            "Impact: Achieved sub-50ms lead dispatch, 100% data integrity across concurrent checkouts, and fully automated back-office order management."
        ),
        "skills": ["Next.js", "Django REST Framework", "PostgreSQL", "Telegram Bot API", "Docker"],
        "thumbnail": "1_catering_ecommerce_5x4.png"
    },
    {
        "id": "betboom",
        "name": "BetBoom Sports Marketing Landing",
        "title": "BetBoom Sports Marketing Landing & Interactive Campaign",
        "role": "Lead Front-End Developer",
        "desc": (
            "Goal: Create a high-converting promotional landing page for a nationwide sports charity campaign.\n\n"
            "Solution: Developed a lightweight, zero-dependency web application using Vanilla JavaScript ES6+ and CSS3 keyframe animations. Engineered custom multi-category equipment carousels, responsive modal forms, and fluid touch navigation.\n\n"
            "Impact: Delivered flawless 60 FPS performance across mobile and desktop devices with zero bundle bloat and sub-second load times."
        ),
        "skills": ["JavaScript", "CSS3 Animations", "HTML5 Canvas", "Responsive Web Design", "Cross-Browser Compatibility"],
        "thumbnail": "2_betboom_campaign_5x4.png"
    },
    {
        "id": "dna",
        "name": "DNA Drop DTC Jewelry Configurator",
        "title": "DNA Drop Personalized DTC Jewelry Configurator",
        "role": "Senior UI/UX Front-End Engineer",
        "desc": (
            "Goal: Design an immersive direct-to-consumer digital storefront for custom DNA-infused jewelry.\n\n"
            "Solution: Implemented an interactive product customizer using modular Sass/SCSS, semantic HTML5, and dynamic DOM state management. Crafted multi-step configuration flows for chain selection, material finishes, and certificate uploads.\n\n"
            "Impact: Increased user engagement through intuitive visual feedback, achieving smooth client-side transitions and perfect mobile responsiveness."
        ),
        "skills": ["JavaScript", "Sass/SCSS", "UI/UX Prototyping", "E-Commerce", "Mobile-First Design"],
        "thumbnail": "3_dna_jewelry_5x4.png"
    },
    {
        "id": "portfolio_hub",
        "name": "Full-Stack Developer Hub & Workspace Console",
        "title": "Full-Stack Developer Hub & Live Architecture Showcase",
        "role": "Full-Stack Engineer & DevOps Architect",
        "desc": (
            "Goal: Architect an interactive engineering hub showcasing live production systems and system telemetry.\n\n"
            "Solution: Built a responsive single-page portal with tabbed runtime inspector consoles, automated health checks, dynamic theme switching, and live Telegram bot dispatch demonstration modals.\n\n"
            "Impact: Showcases production-ready code with 29 passing CI/CD tests, Dockerized deployments, and clean architectural documentation."
        ),
        "skills": ["System Architecture", "CI/CD Pipelines", "Python", "React", "DevOps"],
        "thumbnail": "4_fullstack_hub_5x4.png"
    }
]

print("=== UPWORK PORTFOLIO VALIDATION ===")
all_pass = True
for p in projects:
    t_len = len(p["title"])
    r_len = len(p["role"])
    d_len = len(p["desc"])
    s_cnt = len(p["skills"])
    
    t_ok = t_len <= 70
    r_ok = r_len <= 100
    d_ok = d_len <= 600
    s_ok = s_cnt <= 5
    
    # Dash check (must not contain em dash or en dash)
    all_text = p["title"] + " " + p["role"] + " " + p["desc"] + " " + " ".join(p["skills"])
    no_em_en = ("\u2014" not in all_text) and ("\u2013" not in all_text)
    
    p_pass = t_ok and r_ok and d_ok and s_ok and no_em_en
    if not p_pass:
        all_pass = False
        
    print(f"\n[{p['name']}]")
    print(f"  Title ({t_len}/70 chars): {'PASS' if t_ok else 'FAIL'}")
    print(f"  Role ({r_len}/100 chars): {'PASS' if r_ok else 'FAIL'}")
    print(f"  Desc ({d_len}/600 chars): {'PASS' if d_ok else 'FAIL'}")
    print(f"  Skills ({s_cnt}/5 skills): {'PASS' if s_ok else 'FAIL'}")
    print(f"  Dashes: {'PASS (standard hyphens only)' if no_em_en else 'FAIL (found em/en dash)'}")

print(f"\nOVERALL RESULT: {'ALL PASS' if all_pass else 'SOME FAILED'}")
