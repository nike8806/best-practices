import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Question from './Question';
import mockQuestions from '../mockQuestions.json';

// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

const question = mockQuestions.questions.question[0];

let component;
let handleAnswer;

describe('KBA Question component', () => {
  beforeEach(() => {
    handleAnswer = jest.fn();

    component = shallow(
      <Question type={question.type} title={question.prompt} answers={question.answer} onAnswered={handleAnswer} />
    );
  });

  it('should render correctly', () => {
    expect(component).toMatchSnapshot();
  });

  it('should disable Next button if no answer is selected', () => {
    expect(component.find('button.question__next').props().disabled).toBe(true);
  });

  it('should set state with the selected answer', () => {
    const randomOption = Math.floor(Math.random() * question.answer.length);
    const selectedAnswer = question.answer[randomOption];

    component.find({ value: selectedAnswer }).simulate('change', { target: { value: selectedAnswer } });
    component.update();

    expect(component.state().answer).toBe(selectedAnswer);
  });

  it('should invoque the callback with the selected option', () => {
    const randomOption = Math.floor(Math.random() * question.answer.length);
    const selectedAnswer = question.answer[randomOption];

    component.find({ value: selectedAnswer }).simulate('change', { target: { value: selectedAnswer } });
    component.find('button').simulate('click');

    expect(handleAnswer.mock.calls.length).toBe(1);
    expect(handleAnswer.mock.calls[0][0]).toEqual({ type: question.type, answer: selectedAnswer });
  });

  it('should clear answer from state after execute the callback', () => {
    const newState = Question.getDerivedStateFromProps({ type: 'foo' }, { type: 'bar', answer: 'bar' });

    expect(newState.answer).toBe(null);
  });
});
