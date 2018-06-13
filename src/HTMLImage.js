import React, { PureComponent } from 'react';
import {
  Image,
  View,
  Modal,
  Text,
  TouchableOpacity,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropTypes from 'prop-types';

export default class HTMLImage extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      width: props.imagesInitialDimensions.width,
      height: props.imagesInitialDimensions.height,
      isVisible: false,
    };

    this.toggleModal = this.toggleModal.bind(this);
  }

  static propTypes = {
    source: PropTypes.object.isRequired,
    alt: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    style: Image.propTypes.style,
    imagesMaxWidth: PropTypes.number,
    imagesInitialDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  };

  static defaultProps = {
    imagesInitialDimensions: {
      width: 100,
      height: 100,
    },
  };

  componentDidMount() {
    this.getImageSize();
  }

  componentWillReceiveProps(nextProps) {
    this.getImageSize(nextProps);
  }

  toggleModal() {
    this.setState({ isVisible: !this.state.isVisible });
  }

  getDimensionsFromStyle(style, height, width) {
    let styleWidth;
    let styleHeight;

    if (height) {
      styleHeight = height;
    }
    if (width) {
      styleWidth = width;
    }
    if (Array.isArray(style)) {
      style.forEach((styles) => {
        if (!width && styles['width']) {
          styleWidth = styles['width'];
        }
        if (!height && styles['height']) {
          styleHeight = styles['height'];
        }
      });
    } else {
      if (!width && style['width']) {
        styleWidth = style['width'];
      }
      if (!height && style['height']) {
        styleHeight = style['height'];
      }
    }

    return { styleWidth, styleHeight };
  }

  getImageSize(props = this.props) {
    const { source, imagesMaxWidth, style, height, width } = props;
    const { styleWidth, styleHeight } = this.getDimensionsFromStyle(style,
        height, width);

    if (styleWidth && styleHeight) {
      return this.setState({
        width: typeof styleWidth === 'string' && styleWidth.search('%') !== -1 ?
            styleWidth :
            parseInt(styleWidth, 10),
        height: typeof styleHeight === 'string' &&
        styleHeight.search('%') !== -1 ?
            styleHeight :
            parseInt(styleHeight, 10),
      });
    }
    // Fetch image dimensions only if they aren't supplied or if with or height is missing
    Image.getSize(
        source.uri,
        (originalWidth, originalHeight) => {
          if (!imagesMaxWidth) {
            return this.setState(
                { width: originalWidth, height: originalHeight });
          }
          const optimalWidth = imagesMaxWidth <= originalWidth ?
              imagesMaxWidth :
              originalWidth;
          const optimalHeight = (optimalWidth * originalHeight) / originalWidth;
          this.setState(
              { width: optimalWidth, height: optimalHeight, error: false });
        },
        () => {
          this.setState({ error: true });
        },
    );
  }

  renderHeaderImageViewer() {
    return (
        <View
            style={{ position: 'absolute', right: 20, top: 35, zIndex: 10000 }}>
          <TouchableOpacity onPress={this.toggleModal}>
            <Text style={{
              fontSize: 35,
              fontWeight: 'bold',
              color: '#fff',
            }}>×</Text>
          </TouchableOpacity>
        </View>
    );
  }

  renderImageViewer() {
    const imageUrls = [
      {
        url: this.props.source.uri,
      },
    ];
    return (
        <Modal
            style={{ flex: 1 }}
            visible={this.state.isVisible}
            transparent={true}
            animationType={'fade'}
            onRequestClose={this.toggleModal}
        >
          <ImageViewer
              renderIndicator={() => null}
              renderHeader={() => this.renderHeaderImageViewer()}
              onCancel={this.toggleModal}
              onSwipeDown={this.toggleModal}
              imageUrls={imageUrls}
          />
        </Modal>
    );
  }

  validImage(source, style, props = {}) {
    return (
        <View>
          <TouchableOpacity
              activeOpacity={0.7}
              onPress={this.toggleModal}>
            <Image
                source={source}
                style={[
                  style,
                  {
                    width: this.state.width,
                    height: this.state.height,
                    resizeMode: 'cover',
                  }]}
                {...props}
            />
          </TouchableOpacity>
          {this.renderImageViewer()}
        </View>
    );
  }

  get errorImage() {
    return (
        <View style={{
          width: 50,
          height: 50,
          borderWidth: 1,
          borderColor: 'lightgray',
          overflow: 'hidden',
          justifyContent: 'center',
        }}>
          {this.props.alt ?
              <Text style={{
                textAlign: 'center',
                fontStyle: 'italic',
              }}>{this.props.alt}</Text> :
              false}
        </View>
    );
  }

  render() {
    const { source, style, passProps } = this.props;

    return !this.state.error ?
        this.validImage(source, style, passProps) :
        this.errorImage;
  }
}