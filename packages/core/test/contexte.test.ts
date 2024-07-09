/* eslint-disable no-console */
import chai, { expect } from 'chai'
import 'mocha'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { parse } from 'yaml'
import Engine from '../src'

chai.use(sinonChai)

import reproRules from './rules.json' assert { type: 'json' }

describe('When two different contexte are nested', () => {
	const rulesYaml = parse(`
a: 1
b: a * 2
c:
  valeur: b
  contexte:
      a: 10
d:
  valeur: c
  contexte:
    a: 100
`)
	const sandbox = sinon.createSandbox()

	beforeEach(() => {
		sandbox.spy(console, 'warn')
	})
	afterEach(() => {
		sandbox.restore()
	})
	describe('evaluation of rule on top of the chain', () => {
		it('evaluates to something', () => {
			expect(new Engine(rulesYaml).evaluate('d').nodeValue).to.eq(20)
		})

		it('does not throw any warning', () => {
			new Engine(rulesYaml).evaluate('d')
			expect(console.warn).to.have.not.been.called
		})
	})

	describe('evaluation of middle rule', () => {
		it('evaluates to something', () => {
			expect(new Engine(rulesYaml).evaluate('c').nodeValue).to.be.not.undefined
		})

		it('does not throw any warning', () => {
			new Engine(rulesYaml).evaluate('c')
			expect(console.warn).to.have.not.been.called
		})
	})
})

describe('When rule contains itself in the context', () => {
	const rules = {
		a: 100,
		b: {
			produit: ['a', '50%'],
			plafond: {
				valeur: 'b',
				contexte: {
					a: 50,
				},
			},
		},
	}
	const sandbox = sinon.createSandbox()

	beforeEach(() => {
		sandbox.spy(console, 'warn')
	})
	afterEach(() => {
		sandbox.restore()
	})
	describe('evaluation of rule', () => {
		it('evaluates properly', () => {
			expect(new Engine(rules).evaluate('b').nodeValue).to.eq(25)
		})

		it('does not throw any warning', () => {
			new Engine(rules).evaluate('b')
			expect(console.warn).to.have.not.been.called
		})
	})
})

describe('Repro bug', () => {
	it('evaluates properly', () => {
		const engine = new Engine(reproRules)

		engine.setSituation({
			'karburan . configuration . CVAE': 0.28,
			'karburan . configuration . ATMP': 0.56,
			'karburan . configuration . effectif': 1850,
			'karburan . configuration . seuil coût global': 420,
			'karburan . configuration . seuil net demandé': 220,
			'karburan . configuration . versement mobilité actif': 1,
			'karburan . configuration . réserve financière active': 0,
			'karburan . configuration . forfait social actif': 1,
			'karburan . configuration . prévoyance cadre TA taux patronal': 1.617,
			'karburan . configuration . prévoyance cadre TB taux patronal': 1.317,
			'karburan . configuration . prévoyance cadre TC taux patronal': 1.317,
			'karburan . configuration . prévoyance cadre TB taux salarial': 0.878,
			'karburan . configuration . prévoyance cadre TC taux salarial': 0.878,
			'karburan . configuration . prévoyance etam TA taux patronal': 0.791,
			'karburan . configuration . prévoyance etam TB taux patronal': 0.744,
			'karburan . configuration . prévoyance etam TC taux patronal': 0.744,
			'karburan . configuration . prévoyance etam TB taux salarial': 0.497,
			'karburan . configuration . prévoyance etam TC taux salarial': 0.497,
			'karburan . configuration . coût global mutuelle': 26.4,
			'karburan . configuration . coût global mutuelle avec CVAE': 28.78,
			date: 'karburan . période . premier jour travaillé',
			dirigeant: 'non',
			'karburan . période . mois': "'janvier'",
			'karburan . période . premier jour travaillé': '01/01/2022',
			'karburan . période . dernier jour travaillé': '31/01/2022',
			'karburan . portage . régularisations . tranche 2 . cumul M-1':
				'0 €/mois',
			'karburan . portage . régularisations . tranche A . cumul M-1':
				'0 €/mois',
			'karburan . portage . régularisations . tranche B . cumul M-1':
				'0 €/mois',
			'karburan . portage . régularisations . tranche C . cumul M-1':
				'0 €/mois',
			'karburan . portage . régularisations . brut . cumul M-1': '0 €/mois',
			'karburan . portage . régularisations . PMSS . cumul M-1': '0 €/mois',
			'karburan . portage . régularisations . SMIC . cumul M-1': '0 €/mois',
			'karburan . portage . temps plein par mois': 151.67,
			'karburan . portage . taux horaire': '15.82 €/heure',
			'karburan . portage . salarié . département': "'13'",
			'karburan . portage . salarié . pays': "'FR'",
			'salarié . contrat . statut cadre': 'non',
			"salarié . contrat . date d'embauche": '1/1/2021',
			'salarié . cotisations . prévoyances . santé . montant': '0 €/mois',
			'établissement . commune . département': "'Paris'",
			'établissement . commune . taux versement mobilité': '2.95',
			"karburan . portage . nombre d'heures max": '151.67 heure/mois',
			'impôt . taux personnalisé': 5.6,
			'impôt . méthode de calcul': "'taux personnalisé'",
			'karburan . portage . rémunération . net . payé après impôt':
				'400 €/mois',
		} as any)

		expect(
			engine.evaluate("karburan . portage . nombre d'heures théorique")
				.nodeValue,
		).to.eq(53.85)
	})
})
