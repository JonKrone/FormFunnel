const React = require('react')

module.exports = class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errors: [] }
    this.removeError = this.removeError.bind(this)
  }

  componentDidCatch(error) {
    let errIdx
    this.setState(
      state => {
        errIdx = state.errors.length
        return { errors: state.errors.concat([error]) }
      },
      () => {
        // Automatically remove the error after 15 seconds
        setTimeout(this.removeError.bind(null, errIdx), 15000)
      }
    )
  }

  removeError(idx) {
    this.setState(state => ({
      errors: state.errors.filter((err, i) => i !== idx),
    }))
  }

  render() {
    const haveErrors = this.state.errors.length > 0

    if (!haveErrors) return this.props.children

    return (
      <React.Fragment>
        {haveErrors && (
          <div className="error-zone">
            <h1>Whoops, we got an error!</h1>
            <ul>
              {this.state.errors.map((err, idx) => (
                <li onClick={() => this.removeError(idx)}>
                  {err.message}
                  {err.stack}
                </li>
              ))}
            </ul>
          </div>
        )}
      </React.Fragment>
    )
  }
}
