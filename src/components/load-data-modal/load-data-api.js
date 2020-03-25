import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {CORS_LINK, LOADING_API_MESSAGE, LOADING_URL_MESSAGE} from '../../constants/default-settings';

const propTypes = {
  onLoadDataApi: PropTypes.func.isRequired
};

const StyledDescription = styled.div`
  font-size: 14px;
  color: ${props => props.theme.labelColorLT};
  line-height: 18px;
  margin-bottom: 12px;
`;

const InputForm = styled.div`
  flex-grow: 1;
  padding: 32px;
  background-color: ${props => props.theme.panelBackgroundLT};
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.inputPadding};
  color: ${props => (props.error ? 'red' : props.theme.titleColorLT)};
  height: ${props => props.theme.inputBoxHeight};
  border: 0;
  outline: 0;
  font-size: ${props => props.theme.inputFontSize};

  :active,
  :focus,
  &.focus,
  &.active {
    outline: 0;
  }
`;

const StyledFromGroup = styled.div`
  margin-top: 30px;
  display: flex;
  flex-direction: row;
`;

export const StyledInputLabel = styled.div`
  font-size: 11px;
  color: ${props => props.theme.textColorLT};
  letter-spacing: 0.2px;
  ul {
    padding-left: 12px;
  }
`;

export const StyledBtn = styled.button`
  background-color: ${props => props.theme.primaryBtnActBgd};
  color: ${props => props.theme.primaryBtnActColor};
`;

export const StyledError = styled.div`
  color: red;
`;

export const StyledErrorDescription = styled.div`
  font-size: 14px;
`;

const Error = ({error, url}) => (
  <StyledError>
    <StyledErrorDescription>{url}</StyledErrorDescription>
    <StyledErrorDescription>{error.message}</StyledErrorDescription>
  </StyledError>
);

class LoadDataApi extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dataUrl: ''
    };
  }
  onMapUrlChange = e => {
    // TODO: validate url
    this.setState({
      dataUrl: e.target.value
    });
  };

  onLoadDataApi = () => {
    const dataUrls = ["https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv","https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv"];
    const {dataUrl} = this.state;
    if (!dataUrl) {
      return;
    }


    this.props.onLoadDataApi({dataUrls});
  };

  render() {
    return (
      <div>
        <InputForm>
          <StyledDescription>Load data from an API (graphql or rest)</StyledDescription>
          <StyledInputLabel>{LOADING_URL_MESSAGE}</StyledInputLabel>
          <StyledInputLabel>
            Examples:
            <ul>
              <li>https://your.map.url/graphql</li>
              <li>http://your.map.url/v1/api/states</li>
            </ul>
          </StyledInputLabel>
          <StyledInputLabel>
            * CORS policy must be defined on your custom url domain in order to be accessible. For
            more info{' '}
            <a rel="noopener noreferrer" target="_blank" href={`${CORS_LINK}`}>
              click here
            </a>
          </StyledInputLabel>
          <StyledFromGroup>
            <StyledInput
              onChange={this.onMapUrlChange}
              type="text"
              placeholder="File Url"
              value={this.state.dataUrl}
              error={this.props.error}
            />
            <StyledBtn type="submit" onClick={this.onLoadDataApi}>
              Fetch
            </StyledBtn>
          </StyledFromGroup>
          {this.props.error && <Error error={this.props.error} url={this.props.option.dataUrl} />}
        </InputForm>
      </div>
    );
  }
}

LoadDataApi.propTypes = propTypes;

export default LoadDataApi;
