# Freelance web projects

A small archive of freelance landing pages, translated into English.

## Live demos

- [Project gallery](https://metarenessans.github.io/freelance/)
- [BetBoom — sports community campaign](https://metarenessans.github.io/freelance/bet-boom/)
- [DNA — personalized jewelry](https://metarenessans.github.io/freelance/dna/)

These are archived portfolio demos, not active commercial services. Forms, promotions, prices, contact details and third-party links may no longer be valid. GitHub Pages serves the front end only; it does not process orders or submissions.

## Repository structure

- `bet-boom/src/`: original HTML, JavaScript and styles.
- `bet-boom/public/`: ready-to-serve BetBoom demo.
- `dna/`: ready-to-serve DNA demo and original styles.
- `index.html`: demo gallery.
- `.github/workflows/pages.yml`: validates and publishes the static demos on each push to `main`.

## Local preview

Run `python -m http.server 8000` in the repository root, then visit:

- Gallery: `http://localhost:8000/`
- BetBoom: `http://localhost:8000/bet-boom/public/`
- DNA: `http://localhost:8000/dna/`

The published gallery's BetBoom link is assembled as `/freelance/bet-boom/` by the deployment workflow.

## Checks

```sh
python -m unittest discover -s tests -v
python -m unittest discover -s bet-boom/tests -v
python -m unittest discover -s dna/tests -v
```
