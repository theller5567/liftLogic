import styles from "../../styles/pages/exerciseLibrary.module.scss";

type ExerciseDetailSectionProps = {
  items: string[] | undefined;
  title: string;
};

const ExerciseDetailSection = ({ items, title }: ExerciseDetailSectionProps) =>
  items?.length ? (
    <section className={styles.detailPanel}>
      <h2>{title}</h2>
      <ol>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  ) : null;

export default ExerciseDetailSection;
