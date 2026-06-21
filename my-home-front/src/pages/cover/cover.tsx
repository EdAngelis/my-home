import { useNavigate } from "react-router-dom";
import { AnimatedSVG } from "../../components/animations";

function Cover() {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate("/home")}>
      <AnimatedSVG width={100} height={100} />
    </div>
  );
}

export default Cover;
