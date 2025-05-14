import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPosts } from "../Features/PostSlice";
import { Table } from "reactstrap";
import moment from "moment";

import { likePost } from "../Features/PostSlice";
import { FaThumbsUp } from "react-icons/fa6";

const Posts = () => {
  const posts = useSelector((state) => state.posts.posts);
  const email = useSelector((state) => state.users.user.email);
  const userId = useSelector((state) => state.users.user._id);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getPosts());
  }, []);

  const handleLikePost = (postId) => {
    const postData = {
      postId: postId,
      userId: userId,
    };
    dispatch(likePost(postData));
    navigate("/");
  };

  return (
    <div className="postsContainer">
      <Table className="table table-striped">
        <thead></thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post._id}>
              {/* Ensure to add a unique key for each row */}
              <td>{post.email}</td>
              <td>
                {/*<p>{post.createdAt}</p>*/}
                <p> {moment(post.createdAt).fromNow()}</p>
                {post.postMsg}
                <p className="likes">
                  <a href="#" onClick={() => handleLikePost(post._id)}>
                    <FaThumbsUp />
                  </a>
                  ({post.likes.count})
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div> /* End of posts */
  );
};

export default Posts;
