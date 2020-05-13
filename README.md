ActiveResource.js binding framework for React components

### Getting Started

1. Set a resource, and attach a child component to render with that subject

```jsx
<Resource component={Customer} reflection="customer" subject={customer} />
```

2. Have a field in the child component that responds to the subject from the parent Resource

```jsx
  <Field
    type="email"
    name="email"
    id="email"
    component={Input}
    invalidClassName="is-invalid"
    placeholder="jane.doe@example.com"
  />
  <ErrorsFor className="customer-email-errors" component={FormFeedback} field="email" />
```

3. You can nest Resources with setting a reflection

```jsx
<Resource component={Customer} reflection="customer" subject={customer} />
```

4. Bind some callback logic to the (root) resource

- afterError: PropTypes.func
- afterUpdate: PropTypes.func
- onInvalidSubmit: PropTypes.func
- onSubmit: PropTypes.func
- beforeSubmit: PropTypes.func

### If using nested resources

```jsx
<Resource component={Customer} reflection="customer" subject={subject.customer()} parent={subject} />
```

### Binding and updating values from Fields

```jsx
const fulfillmentType = useRef()

// Render <Input> component for value that keeps subject up to date
<Field
  type="hidden"
  name="fulfillmentType"
  id="fulfillmentType"
  component={Input}
  ref={fulfillmentType}
/>

// Get value
fulfillmentType.current && fulfillmentType.current.state.value

// Update value
fulfillmentType.current && fulfillmentType.current.setValue('value here')
```
