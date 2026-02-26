module.exports = {
  extends: ['taro'],
  rules: {
    // 忽略小程序原生组件的全局变量错误
    'no-undef': 'off',
    // 忽略未使用的变量（仅在小程序原生组件中）
    'no-unused-vars': 'off',
    // 忽略 react/jsx-no-undef（在小程序原生组件中）
    'react/jsx-no-undef': 'off',
  },
  overrides: [
    {
      files: ['src/components/ec-canvas/index.js', 'src/components/WxChart/wx-canvas.js'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
      }
    }
  ]
}
