<script setup>
import Header from './components/Header.vue'
import Calendar from './components/Calendar.vue' 
import { onMounted } from 'vue'
import { db } from './firebase'

</script>

<template>
	<Header /> 
	<router-view />
	<div id="app"></div>
</template>
 