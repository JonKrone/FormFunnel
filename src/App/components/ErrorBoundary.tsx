import React from 'react'

interface Props {
  children: JSX.Element
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch() {
    this.setState({ hasError: true })
    setTimeout(() => this.setState({ hasError: false }), 15000)
  }

  render() {
    return !this.state.hasError ? (
      this.props.children
    ) : (
      <div className="error-zone">
        <h1>Whoops, we got an error!</h1>
      </div>
    )
  }
}
