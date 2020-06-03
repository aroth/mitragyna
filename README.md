ActiveResource.js binding framework for React components

## Installation

```javascript
yarn add @getoccasion/mitragyna
```

You can also use the CDN address https://unpkg.com/@getoccasion/mitragyna to add it to your AMD loader or into your page:

```html
<script type="text/javascript" src="https://unpkg.com/@getoccasion/mitragyna"></script>
```

## Getting Started

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
function  useBoomTown() {
  return [streetRef, street, setStreet]
}

// App.jsx
fuction App() {
  const [streetRef, street, setStreet] = useBoomTown()

  return(
    <Resource subject={myOrder} afterUpdate={saveMyOrder}>
      <Resource component={Customer} subject={subject.customer()}>
        <Resource component={Address} subject={subject.address()}>
          <input type='text' name="street" ref={streetRef}>
          <input type='text' name="town" ref={townRef}>
          <input type='text' name="hood" ref={hoodRef}>
          <input type='text' name="region" ref={regionRef}>
        </Resource>
        <Resource compo subject={subject.address()} />


      </Resource>

      <Resource component={Attendees} subject={subject.attendees()} />

      </Resource>
    </Resource>
  )
}
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
