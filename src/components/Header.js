import { View, Text } from 'react-native'
import React from 'react'

const Header = (props) => {
  return (
    <View  style={{marginLeft: 15,}}>
      <Text style={{fontSize: 20, fontWeight: 'bold',color:'white'}}>
        {props.name}
      </Text>
    </View>
  )
}

export default Header