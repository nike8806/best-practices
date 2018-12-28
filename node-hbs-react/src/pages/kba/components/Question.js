import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Question extends Component {
  static propTypes = {
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    answers: PropTypes.arrayOf(PropTypes.string).isRequired,
    onAnswered: PropTypes.func,
    disabled: PropTypes.bool
  };

  static defaultProps = {
    disabled: false,
    onAnswered: null
  };

  state = {
    // eslint-disable-next-line react/destructuring-assignment, react/no-unused-state
    type: this.props.type,
    answer: null
  };

  static getDerivedStateFromProps(props, state) {
    if (state.type !== props.type) {
      return {
        type: props.type,
        answer: null
      };
    }

    return null;
  }

  /**
   * Sync state with user's selection
   *
   * @param {SyntheticEvent} event The React `SyntheticEvent`
   */
  handleAnswer = (event) => {
    this.setState({ answer: event.target.value });
  };

  /**
   * Invoque prop callback and clear state when clicking Next
   */
  handleNextClick = () => {
    const { onAnswered, type } = this.props;

    if (onAnswered) {
      const { answer } = this.state;
      onAnswered({
        type,
        answer
      });
    }
  };

  /**
   * Render method
   *
   * @return {ReactElement}
   */
  render() {
    const {
      title, type, answers, disabled
    } = this.props;

    const { answer: currentAnswer } = this.state;
    return (
      <div className="question">
        <h5 className="question__title todo-heading">{title}</h5>

        <ul className="question__answers margin-bottom-32 list-unstyled">
          {answers.map(answer => (
            <li key={`${type}-${answer}`} className="question__answer">
              <label
                className="question__answer-text"
                htmlFor={`${type}-${answer}-id`}
              >
                <input
                  id={`${type}-${answer}-id`}
                  type="radio"
                  name="answer"
                  value={answer}
                  className="question__answer-selection todo-radio"
                  checked={currentAnswer === answer}
                  onChange={this.handleAnswer}
                  disabled={disabled}
                />
                <span className="question__answer-radio todo-radio-selector" />
                {answer}
              </label>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn btn-todo center-block question__next"
          disabled={disabled || !currentAnswer}
          onClick={this.handleNextClick}
        >
          Next
        </button>
      </div>
    );
  }
}

export default Question;
