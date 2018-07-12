import classNames from 'classnames';
import shallowEqual from 'shallowequal';

export class Field extends React.Component {
  static contextTypes = {
    changeRadio: PropTypes.func,
    queueChange: PropTypes.func,
    radioValue: PropTypes.any,
    resource: PropTypes.object,
  };

  static childContextTypes = {
    changeRadio: PropTypes.func,
    radioValue: PropTypes.any,
  };

  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.func,
    includeBlank: PropTypes.bool,
    name: PropTypes.string.isRequired,
    options: PropTypes.instanceOf(ActiveResource.Collection),
    optionsLabel: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
    ]),
    type: PropTypes.string.isRequired,
    uncheckedValue: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func,
      PropTypes.string,
      PropTypes.number,
    ]),
    invalidClassName: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func,
      PropTypes.string,
      PropTypes.number,
    ])
  };

  constructor() {
    super();

    _.bindAll(this,
      'afterChange',
      'changeRadio',
      'classNames',
      'commonInputProps',
      'getValue',
      'handleChange',
      'renderCheckboxComponent',
      'renderInputComponent',
      'renderRadioComponent',
      'renderSelectComponent',
      'renderTextareaComponent',
      'setValue',
      'valueFor',
    );

    this.state = {};
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return !(shallowEqual(this.props, nextProps) && shallowEqual(this.state, nextState) && shallowEqual(this.context, nextContext));
  }

  getChildContext() {
    const { type } = this.props;
    const { value } = this.state;

    switch(type) {
      case 'radioGroup':
        return {
          changeRadio: this.changeRadio,
          radioValue: value,
        };
    }
  }

  changeRadio(value) {
    this.setState({ value })
  }

  componentWillMount() {
    const { type } = this.props;
    const { resource } = this.context;

    // Set initial value to that of the resources
    this.setState({
      value: this.valueFor(resource, this.props)
    });

    switch(type) {
      case 'email':
      case 'number':
      case 'text':
      case 'textarea':
        this.afterChange = _.debounce(this.afterChange, 500);
    }
  }

  classNames() {
    const { className, invalidClassName, name } = this.props;
    const { resource } = this.context;

    return classNames(
      className,
      {
        [invalidClassName]: !resource.errors().forField(name).empty()
      }
    );
  }

  commonInputProps() {
    const { name, type } = this.props;

    let props = {
      className: this.classNames(),
      key: name,
      onChange: this.handleChange,
    };

    return props;
  }

  componentFor(type) {
    switch(type) {
      case 'checkbox':
        return this.renderCheckboxComponent();
      case 'radio':
        return this.renderRadioComponent();
      case 'radioGroup':
        return this.renderRadioGroupComponent();
      case 'select':
        return this.renderSelectComponent();
      case 'textarea':
        return this.renderTextareaComponent();
      default:
        return this.renderInputComponent();
    }
  }

  // TODO: Add support for non-resource options on select and radio
  valueFor(resource, props) {
    const { name, type, uncheckedValue, value } = props;

    switch(type) {
      case 'checkbox':
        var resourceValue = resource[name];
        if(resourceValue == value) {
          return true;
        } else if(resourceValue == uncheckedValue || _.isUndefined(resourceValue) || _.isNull(resourceValue)) {
          return false;
        } else {
          throw 'Field ' + name + ' with value ' + resource[name] + ' does not match value or uncheckedValue for checkbox'
        }
      case 'radio':
      case 'select':
        var val = resource[name]();
        return val ? val.id : '';
      default:
        var val = resource[name];

        return val ? val : '';
    }
  }

  render() {
    const { type } = this.props;

    return this.componentFor(type);
  }

  renderCheckboxComponent() {
    const { component, name } = this.props;

    let checkboxProps = _.omit(this.props, _.keys(_.omit(Field.propTypes, 'type')));

    let finalComponent = component || 'input';
    return React.createElement(finalComponent, {
      ...checkboxProps,
      ...this.commonInputProps(),
      checked: this.state.value,
    });
  }

  renderInputComponent() {
    const { component, name } = this.props;

    let inputProps = _.omit(this.props, _.keys(_.omit(Field.propTypes, 'type')));

    let finalComponent = component || 'input';
    return React.createElement(finalComponent, {
      ...inputProps,
      ...this.commonInputProps(),
      value: this.state.value,
    });
  }

  renderRadioComponent() {
    const { component, name, value } = this.props;
    const { radioValue } = this.context;

    if (_.isUndefined(value)) {
      throw 'Input type="radio" must have prop "value"';
    }

    let radioProps = _.omit(this.props, _.keys(_.omit(Field.propTypes, 'type')));

    let finalComponent = component || 'input';
    return React.createElement(finalComponent, {
      ...radioProps,
      ...this.commonInputProps(),
      checked: value.id == radioValue,
      value: value.id,
    });
  }

  renderRadioGroupComponent() {
    return <div>
      { this.props.children }
    </div>;
  }

  renderSelectComponent() {
    const { component, includeBlank, name, options, optionsLabel } = this.props;

    let selectOptions = null;
    if (options.empty()) {
      throw 'Input type="select" must have options';
    } else {
      selectOptions = options.map((o) => {
        return <option key={o.id} value={o.id}>
          {
            _.isString(optionsLabel) ? (
              o[optionsLabel]
            ) : (
              optionsLabel(o)
            )
          }
        </option>;
      });
      if (includeBlank) {
        selectOptions.unshift(<option key={-1} value=''></option>);
      }
    }

    let omittedKeys = component ? _.omit(Field.propTypes, 'type') : Field.propTypes;
    let selectProps = _.omit(this.props, _.keys(omittedKeys));

    let finalComponent = component || 'select';
    return React.createElement(finalComponent, {
      ...selectProps,
      ...this.commonInputProps(),
      value: this.state.value,
    }, selectOptions.toArray());
  }

  renderTextareaComponent() {
    const { component, name } = this.props;

    let textareaProps = _.omit(this.props, _.keys(_.omit(Field.propTypes, 'type')));

    let finalComponent = component || 'textarea';
    return React.createElement(finalComponent, {
      ...textareaProps,
      ...this.commonInputProps(),
      value: this.state.value,
    });
  }

  handleChange(e) {
    e.persist();

    const { max, min, type } = this.props;
    const { changeRadio } = this.context;

    let value;

    switch(type) {
      case 'checkbox':
        value = e.target.checked;
        break;
      case 'number':
        if(e.target.value > max) {
          value = max;
        } else if(e.target.value < min) {
          value = min;
        } else {
          value = e.target.value || min;
        }

        break;
      case 'radio':
        changeRadio(e.target.value);
        break;
      default:
        value = e.target.value;
    }

    this.setState({ value }, this.afterChange);
  }

  afterChange() {
    const { name, type, options, uncheckedValue, value } = this.props;
    const { value: stateValue } = this.state;
    const { queueChange } = this.context;

    let mappedValue;
    switch(type) {
      case 'checkbox':
        if(stateValue) {
          mappedValue = value;
        } else {
          mappedValue = uncheckedValue;
        }
        break;
      case 'radio':
        mappedValue = value;
        break;
      case 'select':
        mappedValue = options.detect((o) => o.id === stateValue);
        break;
      default:
        mappedValue = stateValue;
    }

    queueChange({ [name]: mappedValue });
  }

  getValue() {
    return this.state.value;
  }

  setValue(value) {
    const { type } = this.props;

    let mappedValue = { persist: _.noop };
    switch(type) {
      case 'checkbox':
        mappedValue = { ...mappedValue, target: { checked: value } };
        break;
      default:
        mappedValue = { ...mappedValue, target: { value } };
    }

    this.handleChange(mappedValue);
  }
}
