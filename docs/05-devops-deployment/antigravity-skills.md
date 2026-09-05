# Ecosistema de Skills de Antigravity (`skills.sh`)

## 1. Visión General

El proyecto está configurado con el estándar abierto de **Agent Skills** de [`skills.sh`](https://skills.sh) y el **Antigravity Customization System**.

Las siguientes **Skills de Especialidad UI/UX & Frontend** se encuentran instaladas en la raíz del workspace en `.agents/skills/`:

| Skill | Repositorio / Origen | Propósito y Capacidades |
| :--- | :--- | :--- |
| **`design-taste-frontend`** | `Leonxlnx/taste-skill` | Directrices anti-slop frontend, control de dials visuales (`DESIGN_VARIANCE: 7`, `MOTION_INTENSITY: 6`, `VISUAL_DENSITY: 4`), consistencia de curvatura y contrastes WCAG AA. |
| **`frontend-design`** | `anthropics/skills` | Diseño con personalidad distintiva, tipografía intencional y microinteracciones refinadas. |
| **`ui-ux-pro-max`** | `nextlevelbuilder/ui-ux-pro-max-skill` | Patrones avanzados de UI/UX para interfaces complejas, dashboards de alta densidad y accesibilidad. |
| **`vercel-composition-patterns`** | `vercel-labs/agent-skills` | Composición declarativa de componentes y desacoplamiento de interfaces reactivas. |

---

## 2. Cómo Instalar Nuevas Skills

```bash
npx skills add <url-del-repositorio> --skill <nombre-de-la-skill>
```
Antigravity detecta automáticamente la instalación y ubica los archivos `SKILL.md` en `.agents/skills/<skill_name>/` para su carga progresiva.
