export class Resource extends React.Component {
  static propTypes = {
    afterError: PropTypes.func,
    afterUpdate: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.node]),
    className: PropTypes.string,
    component: PropTypes.func,
    componentProps: PropTypes.object,
    renderFormElement: PropTypes.bool,
    onInvalidSubmit: PropTypes.func,
    onSubmit: PropTypes.func,
    parent: PropTypes.object,
    reflection: PropTypes.string,
    subject: PropTypes.object.isRequired,
  };

  static contextTypes = {
    afterUpdateRoot: PropTypes.func,
    isNestedResource: PropTypes.bool,
    queuedReflectionChanges: PropTypes.array,
    queueReflectionChange: PropTypes.func,
    shiftReflectionQueue: PropTypes.func,
    root: PropTypes.object,
    updateRoot: PropTypes.func,
    updatingRoot: PropTypes.bool,
  };

  static childContextTypes = {
    afterUpdateRoot: PropTypes.func,
    isNestedResource: PropTypes.bool,
    queueChange: PropTypes.func,
    queuedReflectionChanges: PropTypes.array,
    queueReflectionChange: PropTypes.func,
    shiftReflectionQueue: PropTypes.func,
    resource: PropTypes.object,
    root: PropTypes.object,
    updateRoot: PropTypes.func,
    updatingRoot: PropTypes.bool,
  };

  static defaultProps = {
    componentProps: {},
    componentRef: _.noop,
    renderFormelement: true,
  };

  constructor(props, context) {
    super();

    _.bindAll(
      this,
      'afterUpdate',
      'assignChanges',
      'queueReflectionChange',
      'shiftReflectionQueue',
      'queueChange',
      'handleSubmit',
      'updateRoot'
    );

    const { root } = context;
    const { parent, reflection, subject } = props;

    let state = { resource: subject };

    if (reflection) {
      var reflectionInstance = (parent || root).klass().reflectOnAssociation(reflection);
      if (_.isUndefined(reflectionInstance)) throw 'Reflection ' + reflection + ' not found.';
      var inverseReflection = reflectionInstance.inverseOf();
      if (_.isUndefined(inverseReflection)) throw 'Reflection ' + reflection + ' must have inverse.';

      state = {
        ...state,
        inverseReflection,
        queuedChanges: {},
        reflection: reflectionInstance,
        updating: false,
      };
    } else {
      state = {
        ...state,
        queuedReflectionChanges: [],
      };
    }

    this.beforeSubmit = props.beforeSubmit;
    this.state = state;
  }

  componentWillReceiveProps(nextProps) {
    const { afterUpdate } = this.props;
    const { inverseReflection } = this.state;
    const { afterUpdateRoot, queuedReflectionChanges, shiftReflectionQueue } = this.context;

    this.setState({ resource: nextProps.subject });

    if (afterUpdate && !inverseReflection) {
      this.setState({ updating: false });
      this.assignChanges();
    } else {
      if (afterUpdateRoot && inverseReflection && queuedReflectionChanges[0] === this) {
        shiftReflectionQueue();
        this.assignChanges();
      }
    }
  }

  componentDidCatch(error) {
    return <p>{error}</p>;
  }

  afterUpdate(newResource) {
    const { updateRoot } = this.context;
    const { inverseReflection, resource } = this.state;

    console.log('afterUpdate', this.props.subject.klass().name);

    if (inverseReflection) {
      var oldTarget = resource.association(inverseReflection.name).target;
      var newTarget = newResource.association(inverseReflection.name).target;

      if (inverseReflection.collection()) {
        // FIXME: Allow autosave inverseOf collection to appropriately handle multiple resources in the collection,
        //   not just the first. If changing multiple fields of resource quickly, root may not be found in oldTarget
        //   because it has already been replaced by a previous change
        // var index = oldTarget.indexOf(root);
        // var newRoot = newTarget.get(index);
        updateRoot(newTarget.first());
      } else {
        updateRoot(newTarget);
      }
    } else {
      this.updateRoot(newResource);
    }
  }

  assignChanges() {
    const { queuedChanges, resource } = this.state;

    console.log('assignChanges', this.props.subject.klass().name);

    if (_.keys(queuedChanges).length == 0) return;

    var newResource = resource.assignAttributes(queuedChanges);

    this.setState({ queuedChanges: {} });

    this.afterUpdate(newResource);
  }

  queueChange(change) {
    const { afterUpdate } = this.props;
    const { inverseReflection, queuedChanges, updating } = this.state;

    this.setState(
      {
        queuedChanges: {
          ...queuedChanges,
          ...change,
        },
      },
      () => {
        const { afterUpdateRoot, queueReflectionChange, updatingRoot } = this.context;

        if (afterUpdate || afterUpdateRoot) {
          if (inverseReflection) {
            if (updatingRoot) {
              queueReflectionChange(this);
            } else {
              this.assignChanges();
            }
          } else {
            if (!updating) this.assignChanges();
          }
        } else {
          this.assignChanges();
        }
      }
    );
  }

  queueReflectionChange(resource) {
    let { queuedReflectionChanges } = this.state;

    queuedReflectionChanges.push(resource);
    this.setState({ queuedReflectionChanges });
  }

  shiftReflectionQueue() {
    let { queuedReflectionChanges } = this.state;

    queuedReflectionChanges.shift();
    this.setState({ queuedReflectionChanges });
  }

  getChildContext() {
    const { afterUpdate, parent } = this.props;
    const { root, afterUpdateRoot } = this.context;
    const { resource, queuedReflectionChanges, updating } = this.state;

    let childContext = {
      afterUpdateRoot: afterUpdate,
      isNestedResource: true,
      queueChange: this.queueChange,
      queuedReflectionChanges: queuedReflectionChanges,
      queueReflectionChange: this.queueReflectionChange,
      shiftReflectionQueue: this.shiftReflectionQueue,
      root: root || resource,
      resource,
      updateRoot: this.updateRoot,
      updatingRoot: updating,
    };

    return childContext;
  }

  handleSubmit(e, callback) {
    if (e) e.preventDefault();

    const { onSubmit, onInvalidSubmit } = this.props;
    const { resource } = this.state;

    var onSubmitCallback = (resourceToSubmit) => {
      if (!_.isUndefined(onSubmit)) {
        onSubmit(resourceToSubmit);
      }

      if (!_.isUndefined(callback)) {
        callback(resourceToSubmit);
      }
    };

    var onInvalidSubmitCallback = (invalidResource) => {
      if (!_.isUndefined(onInvalidSubmit)) {
        onInvalidSubmit(invalidResource);
      }

      if (!_.isUndefined(callback)) {
        callback(invalidResource);
      }
    };

    let beforeSubmit = this.beforeSubmit || (this.componentRef && this.componentRef.beforeSubmit);
    if (!_.isUndefined(beforeSubmit)) {
      new Promise((resolve, reject) => {
        try {
          var result = beforeSubmit(resource);
          resolve(result);
        } catch (invalid) {
          reject(invalid);
        }
      })
        .then(onSubmitCallback)
        .catch(onInvalidSubmitCallback);
    } else {
      onSubmitCallback(resource);
    }
  }

  render() {
    const { isNestedResource } = this.context;
    const { afterError, children, className, component, componentProps, componentRef, renderFormElement } = this.props;
    const { resource } = this.state;

    let body;
    if (component) {
      body = React.createElement(component, {
        ...componentProps,
        afterUpdate: this.afterUpdate,
        afterError,
        onSubmit: this.handleSubmit,
        subject: resource,
        ref: (c) => {
          this.componentRef = c;
          componentRef(c);
        },
      });
    } else {
      body = children;
    }

    if (!isNestedResource && renderFormElement) {
      return (
        <form className={className} onSubmit={this.handleSubmit}>
          {body}
        </form>
      );
    } else {
      return <section className={className}>{body}</section>;
    }
  }

  updateRoot(newRoot) {
    console.log('updateRoot', this.props.subject.klass().name);
    const { afterUpdate } = this.props;
    const { resource } = this.state;

    this.setState({ resource: newRoot });

    if (afterUpdate) {
      console.log('  -> afterUpdate is set');
      afterUpdate(newRoot, resource);
      this.setState({ updating: true });
    }
  }
}
