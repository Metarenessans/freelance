import React from 'react';
import styles from './CicdGate.module.scss';
import type { CicdStage } from '../../types';

export const CicdGate: React.FC = () => {
  const stages: CicdStage[] = [
    {
      step: 'STAGE 01',
      status: 'PASSED',
      name: 'Unit Tests',
      desc: 'Automated test discovery validating catalog integrity, animation attributes, and multi-domain endpoints.',
      command: 'python -m unittest',
    },
    {
      step: 'STAGE 02',
      status: 'VERIFIED',
      name: 'Quality Gate',
      desc: 'Strict translation integrity check, Cyrillic character prevention, and isolated demo build boundaries.',
      command: 'test_no_cyrillic',
    },
    {
      step: 'STAGE 03',
      status: 'OPTIMIZED',
      name: 'Asset Compilation',
      desc: 'Static tree assembly, Sass/test exclusion, Jekyll bypass (.nojekyll), and bundle packaging.',
      command: 'upload-artifact@v3',
    },
    {
      step: 'STAGE 04',
      status: 'ACTIVE',
      name: 'Automated Deploy',
      desc: 'Atomic GitHub Pages release step verifying deployment URL health and environment states.',
      command: 'deploy-pages@v4',
    },
  ];

  return (
    <section className={styles.cicdSection} id="automation">
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionEyebrow}>AUTOMATION & DEVOPS INFRASTRUCTURE</div>
          <h2 className={styles.sectionTitle}>Automated CI/CD & Quality Gates</h2>
          <p className={styles.sectionDesc}>
            Production test discovery, compliance scanning, and zero-downtime deployment executed on every push via GitHub Actions.
          </p>
        </div>
        <a
          className={styles.btnTestApp}
          href="https://github.com/Metarenessans/freelance/actions"
          target="_blank"
          rel="noopener noreferrer"
        >
          Inspect Live Actions Runs ↗
        </a>
      </div>

      <div className={styles.cicdCard}>
        <div className={styles.cicdGrid}>
          {stages.map((stage, idx) => (
            <div key={idx} className={styles.cicdStageCard}>
              <div className={styles.cicdStageTop}>
                <span className={styles.cicdStageStep}>{stage.step}</span>
                <span className={styles.cicdStatusPill}>
                  <span className={styles.statusDot}></span>
                  {stage.status}
                </span>
              </div>
              <div className={styles.cicdStageName}>{stage.name}</div>
              <div className={styles.cicdStageDesc}>{stage.desc}</div>
              <div className={styles.cicdStageMeta}>
                <code>{stage.command}</code>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cicdTerminal}>
          <div className={styles.cicdTerminalHeader}>
            <div className={styles.cicdTerminalControls}>
              <span className={`${styles.terminalDot} ${styles.terminalDotRed}`}></span>
              <span className={`${styles.terminalDot} ${styles.terminalDotYellow}`}></span>
              <span className={`${styles.terminalDot} ${styles.terminalDotGreen}`}></span>
            </div>
            <div className={styles.cicdTerminalTitle}>
              runner@github-actions: ~/work/freelance (pages.yml)
            </div>
            <div className={styles.cicdTerminalBadge}>
              <span className={styles.terminalStatusDot}></span>
              <span>17/17 Passed • 19s</span>
            </div>
          </div>

          <pre className={styles.cicdTerminalBody}>
            <code>
              <span className={styles.tDim}>Run actions/checkout@v4</span>{'\n'}
              <span className={styles.tDim}>Syncing repository to /home/runner/work/freelance/freelance (commit: </span>
              <span className={styles.tCmd}>main</span>
              <span className={styles.tDim}>)</span>{'\n\n'}
              <span className={styles.tHead}>▶ Step 1: Validate catalog and translations</span>{'\n'}
              <span className={styles.tPrompt}>$</span>{' '}
              <span className={styles.tCmd}>python -m unittest discover -s tests -v</span>{'\n'}
              test_avatar_and_animations_present (test_pages.PagesTests) ... <span className={styles.tOk}>ok</span>{'\n'}
              test_catalog_links_to_both_demos (test_pages.PagesTests) ... <span className={styles.tOk}>ok</span>{'\n'}
              test_flagship_catering_source_present (test_pages.PagesTests) ... <span className={styles.tOk}>ok</span>{'\n'}
              test_favicon_present (test_pages.PagesTests) ... <span className={styles.tOk}>ok</span>{'\n'}
              test_modular_scss_and_compiled_css_present (test_pages.PagesTests) ... <span className={styles.tOk}>ok</span>{'\n'}
              <span className={styles.tDim}>Ran 5 tests in 0.003s - </span><span className={styles.tOk}>OK</span>{'\n\n'}
              <span className={styles.tPrompt}>$</span>{' '}
              <span className={styles.tCmd}>python -m unittest discover -s bet-boom/tests -v</span>{'\n'}
              test_deployed_html_assets_are_relative_and_exist ... <span className={styles.tOk}>ok</span>{'\n'}
              test_first_party_text_and_paths_have_no_cyrillic ... <span className={styles.tOk}>ok</span>{'\n'}
              test_source_and_public_html_match_and_use_english ... <span className={styles.tOk}>ok</span>{'\n'}
              <span className={styles.tDim}>Ran 3 tests in 0.039s - </span><span className={styles.tOk}>OK</span>{'\n\n'}
              <span className={styles.tPrompt}>$</span>{' '}
              <span className={styles.tCmd}>python -m unittest discover -s dna/tests -v</span>{'\n'}
              test_assets_resolve_under_a_nested_pages_path ... <span className={styles.tOk}>ok</span>{'\n'}
              test_buyer_email_is_labeled_for_the_buyer ... <span className={styles.tOk}>ok</span>{'\n'}
              test_color_selection_has_correct_step_number ... <span className={styles.tOk}>ok</span>{'\n'}
              test_first_party_text_contains_no_cyrillic ... <span className={styles.tOk}>ok</span>{'\n'}
              test_source_and_shipped_bundle_share_english_titles ... <span className={styles.tOk}>ok</span>{'\n'}
              test_translated_radio_values_match_image_covers ... <span className={styles.tOk}>ok</span>{'\n'}
              <span className={styles.tDim}>Ran 6 tests in 0.023s - </span><span className={styles.tOk}>OK</span>{'\n\n'}
              <span className={styles.tPrompt}>$</span>{' '}
              <span className={styles.tCmd}>python -m unittest discover -s catering/tests -v</span>{'\n'}
              test_application_text_is_english ... <span className={styles.tOk}>ok</span>{'\n'}
              test_original_personal_portrait_is_not_published ... <span className={styles.tOk}>ok</span>{'\n'}
              test_private_runtime_artifacts_are_not_in_publication_copy ... <span className={styles.tOk}>ok</span>{'\n'}
              <span className={styles.tDim}>Ran 3 tests in 0.044s - </span><span className={styles.tOk}>OK</span>{'\n\n'}
              <span className={styles.tHead}>▶ Step 2: Assemble static demos</span>{'\n'}
              <span className={styles.tDim}>Assembling bundle into _site/ directory</span>{'\n'}
              <span className={styles.tOk}>✓</span> Created _site/bet-boom and _site/dna directories{'\n'}
              <span className={styles.tOk}>✓</span> Copied index.html, avatar.png and favicon suite{'\n'}
              <span className={styles.tOk}>✓</span> Excluded test suites and SCSS sources{'\n'}
              <span className={styles.tOk}>✓</span> Generated .nojekyll flag file{'\n\n'}
              <span className={styles.tHead}>▶ Step 3: Deploy to GitHub Pages</span>{'\n'}
              <span className={styles.tDim}>Uploading artifact to GitHub Pages backend...</span>{'\n'}
              <span className={styles.tDim}>Triggering deployment id: pages-run-main-latest</span>{'\n'}
              <span className={styles.tOk}>✓ Deployment successful:</span>{' '}
              <a
                href="https://metarenessans.github.io/freelance/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tLink}
              >
                https://metarenessans.github.io/freelance/
              </a>{' '}
              <span className={styles.tDim}>(HTTP 200 OK)</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
};
