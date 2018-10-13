import React from 'react';
import Enzyme, { mount, shallow } from 'enzyme';
import axios from 'lc-axios';
import Kba from './Kba';
import Question from './components/Question';
import { SuccessMessage, Loader, Modal } from 'components';
import mockQuestions from './mockQuestions.json';
mockQuestions.questions = (mockQuestions.questions && mockQuestions.questions.question) || [];
// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

const questions = mockQuestions.questions;
const mockSelectedAnswers = [
  { type: 'current.county.b', answer: 'FULTON' },
  { type: 'previous.address', answer: '3 CRESSING CT' },
  { type: 'purchased.property.from', answer: 'A VIRAY' }
];

const kbaTitleSelector = '.kba__title';
const outageSelector = '.kba__outage-section';
const mainSectionSelector = '.kba__main-section';
const doneSectionSelector = '.kba__done-section';


describe.only('KBA React component', () => {
  describe('At mouting', () => {
    let component;

    beforeEach(() => {
      component = shallow(<Kba />);
    });

    it('should render correctly', () => {
      expect(component).toMatchSnapshot();
    });

    it('should display a loader indicator', () => {
      expect(component.find(Loader).length).toBe(1);
    });

    it('should trigger an AJAX call to fetch questions', async() => {
      axios.get = jest.fn().mockResolvedValue({});

      await component.instance().componentDidMount();
      expect(axios.get).toBeCalled();
      expect(axios.get).toBeCalledWith('/todo/kba/questions');
      expect(component.find(mainSectionSelector).length).toBe(1);
    });
  });

  describe('At modal oppened', () => {
    let component;
    beforeEach(() => {
      jest.useFakeTimers();
      component = mount(<Kba />);
    });

    it('The modal should be closed when the user click outside', () => {
      component.setState({ errorMessage: 'ERROR' });
      let modalInstance = component.update().find(Modal);
      expect(modalInstance.length).toBe(1);
      modalInstance.find('.modal-backdrop').first().simulate('click', { preventDefault() { } });
      expect(component.update().find(Modal).length).toBe(0);
    });

    it('An ERROR Modal should be closed after 5 seconds', () => {
      component.setState({ errorMessage: 'Has ERROR' });
      expect(component.update().find(Modal).length).toBe(1);
      jest.runAllTimers();
      expect(component.update().find(Modal).length).toBe(0);
    });
  });

  describe('Fetching questions', () => {
    describe('When response with an error', () => {
      let component;

      beforeEach(async() => {
        component = shallow(<Kba />);
        axios.get = jest.fn().mockRejectedValue({ response: {} });

        await component.instance().componentDidMount();
      });

      it('should render correctly', () => {
        component.update();
        expect(component).toMatchSnapshot();
      });

      it('Should render an outage section', () => {
        component.update();
        expect(component.find(Loader).length).toBe(0);
        expect(component.find(outageSelector).length).toBe(1);
        expect(component.find(mainSectionSelector).length).toBe(0);
      });

      it('Should render the kba title on successfully fetching questions', () => {
        expect(component.find(kbaTitleSelector).length).toBe(1);
      });
    });

    describe('With a success response', () => {
      describe('With "REQUESTED" message', () => {
        let component;
        beforeEach(async() => {
          const requestedMock = { data: { ...mockQuestions, message: 'REQUESTED' } };
          axios.get = jest.fn().mockResolvedValue(requestedMock);
          component = mount(<Kba />);

          await component.instance().componentDidMount();
          component.update();
        });

        it('should render correctly', () => {
          expect(component).toMatchSnapshot();
        });

        it('Should render an outage section', () => {
          expect(component.update().find(mainSectionSelector).length).toBe(0);
          expect(component.find(outageSelector).length).toBe(2);
          expect(component.find(doneSectionSelector).length).toBe(0);
          expect(component.find(Modal).length).toBe(0);
        });
      });
      describe('With not "REQUESTED" message', () => {
        let component;
        beforeEach(async() => {
          axios.get = jest.fn().mockResolvedValue({ data: mockQuestions });
          component = mount(<Kba />);

          await component.instance().componentDidMount();
          component.update();
        });

        it('should render correctly', () => {
          expect(component).toMatchSnapshot();
        });

        it('should save the needed part of the  response in a state', () => {
          expect(component.state().questions).toEqual(questions);
        });

        it('should keep track of current question in the state', () => {
          const randomAnsweredQuestions = Math.floor(Math.random() * questions.length) + 1;

          for (let i = 0; i < randomAnsweredQuestions; i++) {
            component.find('input[type="radio"]').at(0).simulate('change');
            component.find('button').simulate('click');
          }

          expect(component.state().currentQuestionIndex).toEqual(randomAnsweredQuestions);
        });

        it('should show the current question data', () => {
          const randomQuestionIndex = Math.floor(Math.random() * questions.length);
          const questionData = questions[randomQuestionIndex];

          component.setState({ currentQuestionIndex: randomQuestionIndex });

          expect(component.find(Question).props()).toMatchObject({
            type: questionData.type,
            title: questionData.prompt,
            answers: questionData.answer
          });
          expect(component.find(mainSectionSelector).length).toBe(1);
          expect(component.find(outageSelector).length).toBe(0);
          expect(component.find(doneSectionSelector).length).toBe(0);
          expect(component.find(Modal).length).toBe(0);
        });

        it('should change the current state between questions until all questions are answered', () => {
          for (let i = 1; i <= questions.length; i++) {
            component.find('input[type="radio"]').at(0).simulate('change');
            component.find('button').simulate('click');

            const currentState = component.state();

            expect(currentState.answers.length).toBe(i);
            expect(currentState.currentQuestionIndex).toBe(i);
          }

          const finalState = component.state();
          expect(finalState.answers.length).toBe(3);
          expect(finalState.currentQuestionIndex).toBe(3);
        });

        it('Should render the kba title while answering the questions', () => {
          expect(component.find(kbaTitleSelector).length).toBe(1);
        });

        it('should trigger a POST AJAX call when all questions are answered', () => {
          const mockPayload = {
            idquestionnaireAnswers: {
              idNumber: 1944906967,
              question1Type: 'current.county.b',
              question1Answer: 'FULTON',
              question2Type: 'previous.address',
              question2Answer: '3 CRESSING CT',
              question3Type: 'purchased.property.from',
              question3Answer: 'A VIRAY'
            },
            loanId: 127235022
          };

          axios.post = jest.fn().mockResolvedValue({});

          for (let i = 0; i < questions.length; i++) {
            component.find('input[type="radio"]').at(0).simulate('change');
            component.find('button').simulate('click');
          }

          expect(component.find(Loader).length).toBe(1);
          expect(axios.post).toHaveBeenCalled();
          expect(axios.post).toHaveBeenCalledTimes(1);
          expect(axios.post).toHaveBeenCalledWith('/todo/kba/answers', mockPayload);
        });
      });
    });
  });
  describe('At sending answers', () => {
    describe('On error sending answers', () => {
      let component;

      beforeEach(() => {
        axios.get = jest.fn().mockResolvedValue({ data: mockQuestions });
        axios.post = jest.fn().mockRejectedValue({ data: {} });

        component = shallow(<Kba />);

        mockSelectedAnswers.forEach(answer => component.instance().handleQuestionAnswered(answer));
      });

      it('should render an error message', () => {
        component.update();

        expect(component.find(Loader).length).toBe(0);
        expect(component.find(Modal).length).toBe(1);
        expect(component.find('.kba__modal-error').length).toBe(1);
        expect(component.update().find(mainSectionSelector).length).toBe(1);
        expect(component.find(outageSelector).length).toBe(0);
        expect(component.find(doneSectionSelector).length).toBe(0);
      });

      it('without clear question', () => {
        component.update();
        expect(component.find(Question).length).toBe(1);
      });

      it('Should render the kba title when an error is thrown', () => {
        expect(component.find(kbaTitleSelector).length).toBe(1);
      });
    });

    describe('All question correctly answered', () => {
      let component;
      const answersResponse = { state: 'DONE' };
      beforeEach(() => {
        axios.get = jest.fn().mockResolvedValue({ data: mockQuestions });
        axios.post = jest.fn().mockResolvedValue({ data: answersResponse});

        component = shallow(<Kba />);

        mockSelectedAnswers.forEach(answer => component.instance().handleQuestionAnswered(answer));
      });

      it('should render a success message', () => {
        component.update();

        expect(component.find(Loader).length).toBe(0);
        expect(component.find(Modal).length).toBe(0);
        expect(component.find(Question).length).toBe(0);
        expect(component.find(SuccessMessage).length).toBe(1);
        expect(component.find(SuccessMessage).props().title).toBe('Thank you. We have verified your identity');
        expect(component.find(doneSectionSelector).length).toBe(1);
        expect(component.update().find(mainSectionSelector).length).toBe(0);
      });

      it('Should not render the kba title if questions are answered and submmited', () => {
        component.update();
        expect(component.state().doneMessage).not.toBeNull();
        expect(component.find(kbaTitleSelector).length).toBe(0);
      });
    });

    describe('Two of tree questions correctly answered', () => {
      let component;
      const answersResponse = {
        state: 'PENDING',
        questions: [{
          answer: [
            'SEBASTIAN',
            'SCHLEICHER',
            'FULTON',
            'None of the above'
          ],
          type: 'current.county.b',
          prompt: 'In which county have you lived?'
        }]
      };

      beforeEach(() => {
        axios.get = jest.fn().mockResolvedValue({ data: mockQuestions });
        axios.post = jest.fn().mockResolvedValue({ data: answersResponse });

        component = shallow(<Kba />);

        mockSelectedAnswers.forEach(answer => component.instance().handleQuestionAnswered(answer));
      });

      it('should set state with the new question', () => {
        component.update();
        expect(component.state().questions).toBe(answersResponse.questions);
        expect(component.state().currentQuestionIndex).toBe(0);
      });

      it('Should render the main Section while the fourth question is being displayed', () => {
        expect(component.find(kbaTitleSelector).length).toBe(1);
        expect(component.find(mainSectionSelector).length).toBe(1);
        expect(component.find(outageSelector).length).toBe(0);
        expect(component.find(doneSectionSelector).length).toBe(0);
        expect(component.find(Modal).length).toBe(0);
      });
    });

    describe('When the answers were wrong', () => {
      let component;
      beforeEach(() => {
        axios.get = jest.fn().mockResolvedValue({ data: mockQuestions });
        axios.post = jest.fn().mockResolvedValue({ data: { state: 'COMPLETED'} } );

        component = shallow(<Kba />);

        mockSelectedAnswers.forEach(answer => component.instance().handleQuestionAnswered(answer));
      });

      it('should render a finished message', () => {
        component.update();

        expect(component.find(Loader).length).toBe(0);
        expect(component.find(Modal).length).toBe(0);
        expect(component.find(Question).length).toBe(0);
        expect(component.find(SuccessMessage).length).toBe(1);
        expect(component.find(SuccessMessage).props().title).toBe('Thank you. We will be in touch if we need additional information');
        expect(component.find(doneSectionSelector).length).toBe(1);
        expect(component.find(outageSelector).length).toBe(0);
        expect(component.find(mainSectionSelector).length).toBe(0);
      });

      it('Should not render the kba title after the questions are answered and submmited', () => {
        component.update();
        expect(component.state().doneMessage).not.toBeNull();
        expect(component.find(kbaTitleSelector).length).toBe(0);
      });
    });
  });
});
