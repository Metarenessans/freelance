import styles from "./skeleton.module.scss";

export const SectionsSkeleton = () => {
  return (
    <div className={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.cardSkeleton} />
      ))}
    </div>
  );
};
