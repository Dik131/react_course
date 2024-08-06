import styles from "./Button.module.css";
const Button = (props) => {
  const { children, onClick, disabled = false, title } = props;
  return (
    <button
      {...props}
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
