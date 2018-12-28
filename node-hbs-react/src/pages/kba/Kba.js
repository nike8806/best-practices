import React, { Component } from 'react';
import axios from 'lc-axios';
import {
  Timeout, SuccessMessage, Loader, Modal
} from 'components';
import Question from './components/Question';

const DONE_MESSAGES = {
  DONE: 'Thank you. We have verified your identity',
  DONE_NEED_INFORMATION: 'Thank you. We will be in touch if we need additional information'
};

const OUTAGE_MESSAGES = {
  OUTAGE_ERROR: {
    title: 'Sorry, looks like we can\'t do this online',
    subtitle: 'A member of our team will contact you.'
  },
  OUTAGE_QUESTIONS_REQUESTED: {
    title: 'Sorry, looks like we can\'t do this online'
  }
};

/**
 * Handles all interactions with Knowledge Based Authentication UI.
 */
class Kba extends Component {
  state = {
    answers: [],
    questions: [],
    idNumber: null,
    loanId: null,
    currentQuestionIndex: 0,
    // Options: MAIN, DONE, DONE_NEED_INFORMATION,
    // OUTAGE_ERROR, OUTAGE_QUESTIONS_REQUESTED
    showSection: 'MAIN',
    errorMessage: null,
    showLoader: true
  };

  componentDidMount() {
    axios.get('/todo/kba/questions')
      .then((response) => {
        if (response.data.message === 'REQUESTED') {
          this.setState({
            showLoader: false,
            showSection: 'OUTAGE_QUESTIONS_REQUESTED'
          });
        } else {
          this.setState({
            questions: response.data.questions,
            idNumber: response.data.idNumber,
            loanId: response.data.loanId,
            showLoader: false
          });
        }
      })
      .catch(() => {
        this.setState({
          showSection: 'OUTAGE_ERROR',
          showLoader: false
        });
      });
  }

  handleQuestionAnswered = (selection) => {
    this.setState(
      ({ answers, currentQuestionIndex }) => ({
        answers: [...answers, selection],
        currentQuestionIndex: currentQuestionIndex + 1
      }),
      () => {
        const {
          currentQuestionIndex,
          questions
        } = this.state;
        if (currentQuestionIndex >= questions.length) {
          this.setState({
            showLoader: true,
            errorMessage: null
          });

          this.submitAnswers();
        }
      }
    );
  };

  handleDismissModal = () => {
    this.setState({
      errorMessage: ''
    });
  };

  submitAnswers() {
    const {
      answers, loanId, idNumber, currentQuestionIndex
    } = this.state;

    const payload = {
      loanId,
      idquestionnaireAnswers: {
        idNumber
      }
    };

    answers.forEach(({ answer, type }, index) => {
      payload.idquestionnaireAnswers[`question${index + 1}Type`] = type;
      payload.idquestionnaireAnswers[`question${index + 1}Answer`] = answer;
    });

    axios.post('/todo/kba/answers', payload)
      .then((response) => {
        const { data: responseData } = response || {};
        const {
          state: stateResponse = 'COMPLETED'
        } = responseData || {};

        let newState = {};

        switch (stateResponse) {
          case 'DONE':
            newState = {
              questions: [],
              showSection: 'DONE'
            };
            break;

          case 'PENDING':
            newState = {
              questions: responseData.questions,
              currentQuestionIndex: 0,
              answers: [],
              showSection: 'MAIN'
            };
            break;

          case 'COMPLETED':
            newState = {
              questions: [],
              answers: [],
              showSection: 'DONE_NEED_INFORMATION'
            };

            break;
          default:
            newState = {
              errorMessage: 'Sorry, we are having technical difficulties. Please try again later.',
              answers: answers.slice(0, -1),
              currentQuestionIndex: currentQuestionIndex - 1,
              showLoader: false
            };
        }

        this.setState({
          ...newState,
          showLoader: false
        });
      })
      .catch(() => {
        this.setState({
          errorMessage: 'Sorry, we are having technical difficulties. Please try again later.',
          answers: answers.slice(0, -1),
          currentQuestionIndex: currentQuestionIndex - 1,
          showLoader: false
        });
      });
  }

  render() {
    const {
      questions, currentQuestionIndex, errorMessage, showLoader, showSection
    } = this.state;
    const isDone = questions.length > 0 && currentQuestionIndex >= questions.length;
    const question = isDone ? questions[questions.length - 1] : questions[currentQuestionIndex];
    const doneMessage = DONE_MESSAGES[showSection];
    const {
      title: outageTitle,
      subtitle: outageSubtitle
    } = OUTAGE_MESSAGES[showSection] || {};

    return (
      <div className="kba">
        <div className="todo-body">
          {(showSection === 'MAIN') && (
            <React.Fragment>
              <div className="kba__main-section">
                <h1 className="kba__title todo-heading">
                  Answer a few brief questions to keep your account safe
                </h1>

                {question && (
                  <Question
                    type={question.type}
                    title={question.prompt}
                    answers={question.answer}
                    onAnswered={this.handleQuestionAnswered}
                    disabled={isDone}
                  />
                )}
              </div>
            </React.Fragment>
          )}

          {doneMessage && (
            <SuccessMessage
              className="kba__done-section"
              title={doneMessage}
            >
              <a
                className="btn btn-todo"
                href="/account/myAccount.action"
              >
                Return to task list
              </a>
            </SuccessMessage>
          )}

          {outageTitle && (
            <SuccessMessage
              className="kba__outage-section"
              title={outageTitle}
              subtitle={outageSubtitle}
            >
              <a
                className="btn btn-todo"
                href="/account/myAccount.action"
              >
                Return to task list
              </a>
            </SuccessMessage>
          )}

          {errorMessage && (
            <Timeout
              delay={5000}
              onTimeout={this.handleDismissModal}
            >
              <Modal
                className="todo-modal kba__modal-error"
                onDismiss={this.handleDismissModal}
              >
                <h2 className="todo-heading text-center padding-all-0">
                  {errorMessage}
                </h2>
              </Modal>
            </Timeout>
          )}
        </div>

        {showLoader && (
          <Loader theme="fixed" />
        )}
      </div>
    );
  }
}

export default Kba;
