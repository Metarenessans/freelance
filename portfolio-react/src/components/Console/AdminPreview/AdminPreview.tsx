import React from 'react';
import styles from './AdminPreview.module.scss';

export const AdminPreview: React.FC = () => {
  return (
    <div className={styles.adminCardsGrid}>
      <div className={styles.adminFeatureCard}>
        <h4>1-Click Telegram Action</h4>
        <p>
          Bespoke action buttons embedded directly into the Django order view allowing operators to
          re-dispatch notifications on demand with audit feedback.
        </p>
      </div>

      <div className={styles.adminFeatureCard}>
        <h4>Dish Image Previews</h4>
        <p>
          Custom <code>OrderItemInline</code> rendering live photographic thumbnails inside order
          lines so kitchen staff visually verify dish selection.
        </p>
      </div>

      <div className={styles.adminFeatureCard}>
        <h4>Subscriber & SMTP Tools</h4>
        <p>
          Dedicated administration tools to manage Telegram chat subscriber bindings and built-in
          SMTP diagnostics to test email delivery health.
        </p>
      </div>
    </div>
  );
};
