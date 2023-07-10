const Web3 = require('web3');
const ganache = require('ganache-cli');
const assert = require('assert');
const {interface, bytecode} = require('../compile');
const {describe} = require('mocha');

const web3 = new Web3(ganache.provider());

let accounts;
let lottery;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface)).deploy({data : bytecode}).send({from : accounts[0], gas : '1000000'});
});

describe('Lottery', () => {

    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('checking the manager',async () => {
        const manager = await lottery.methods.manager().call();
        assert.equal(manager, accounts[0]);
    });

    it('enters multiple player', async () => {
        await lottery.methods.bet().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.bet().send({
            from: accounts[2],
            value: web3.utils.toWei('0.2', 'ether')
        });
        await lottery.methods.bet().send({
            from: accounts[3],
            value: web3.utils.toWei('2', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(3, players.length);
    });

    it('checks for minimum ammount', async () => {
        try {
            await lottery.methods.bet().send({
                from: accounts[4],
                value: 0
            })
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('only manager can pick winner', async () => {
        try{
            await lottery.methods.selectWinner().call({
                from: accounts[1]
            });
            assert(false);
        }catch(error){
            assert(error);
        }
    });

    it('sending ethers to the winner successfully', async () => {
        await lottery.methods.bet().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.selectWinner().send({
            from: accounts[0]
        });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const reminder = finalBalance - initialBalance;
        assert(reminder > web3.utils.toWei('1.9', 'ether'));
    });

    it('the array is now empty', async () => {
        await lottery.methods.bet().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });

        let players = await lottery.methods.getPlayers().call();
        const initialLength = players.length;

        await lottery.methods.selectWinner().send({
            from: accounts[0]
        });

        players = await lottery.methods.getPlayers().call();
        const finalLength = players.length;

        assert.equal(initialLength, 1);
        assert.equal(finalLength, 0);
    });
});