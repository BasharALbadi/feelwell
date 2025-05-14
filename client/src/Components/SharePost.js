import { Container, Row, Col, Input, Button } from "reactstrap";

import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { savePost } from "../Features/PostSlice";

const SharePosts = () => {
  const [postMsg, setpostMsg] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const email = useSelector((state) => state.users.user.email);

  const handlePost = async () => {
    // Validate that postMsg is not empty
    if (!postMsg.trim()) {
      alert("Post message is required."); // Display an alert or set an error state
      return; // Exit the function early if validation fails
    }

    const postData = {
      postMsg: postMsg,
      email: email,
    };

    dispatch(savePost(postData)); // Dispatch the savePost thunk from the Posts Slice.
    setpostMsg(""); //clear the text area after posting
  };

  return (
    <Container>
      <Row>
        <Col>
          <Input
            id="share"
            name="share"
            placeholder="Share your thoughts..."
            type="textarea"
            value={postMsg}
            onChange={(e) => setpostMsg(e.target.value)}
          />
          <Button onClick={() => handlePost()}>PostIT</Button>
        </Col>
      </Row>
    </Container>
  );
};

export default SharePosts;
