import styles from "./Button.module.css";
const Button = ({ children, onClick, disabled = false, title }) => {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;
